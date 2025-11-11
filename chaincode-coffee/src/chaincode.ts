import { Context, Contract, Info, Transaction } from 'fabric-contract-api';
import { Order } from './models/order';
import { Batch } from './models/batch';

@Info({
    title: 'CoffeeSupplyChain',
    description: 'Smart Contract for tracking coffee supply chain from farm to retailer',
})
export class CoffeeSupplyChainContract extends Contract {

    // ===== 1. Place a new order =====
    @Transaction()
    public async placeOrder(
        ctx: Context,
        orderId: string,
        coffeeType: string,
        quantity: number,
        orderingOrg: string,
        expectedDelivery: string
    ): Promise<void> {
        const exists = await ctx.stub.getState(orderId);
        if (exists && exists.length > 0) {
            throw new Error(`Order already exists: ${orderId}`);
        }

        const order = new Order();
        order.orderId = orderId;
        order.coffeeType = coffeeType;
        order.quantity = quantity;
        order.orderingOrg = orderingOrg;
        const txTimestamp = await ctx.stub.getTxTimestamp();
        const orderDate = new Date(
            txTimestamp.seconds.low * 1000
        ).toISOString();
        order.orderDate = orderDate;
        order.expectedDelivery = expectedDelivery;
        order.status = 'ORDER_PLACED';
        order.batchIds = [];

        await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(order)));
    }

    // ===== 2. Create batch =====
    @Transaction()
    public async createBatch(
        ctx: Context,
        batchId: string,
        orderId: string,
        quantity: number,
        productOwner: string
    ): Promise<void> {
        const existingBatch = await ctx.stub.getState(batchId);
        if (existingBatch && existingBatch.length > 0) {
            throw new Error(`Batch ${batchId} already exists`);
        }

        const orderBytes = await ctx.stub.getState(orderId);
        if (!orderBytes || orderBytes.length === 0) {
            throw new Error(`Order ${orderId} does not exist`);
        }

        const order: Order = JSON.parse(orderBytes.toString());

        const batch: Batch = {
            docType: 'batch',
            batchId,
            orderId,
            productOwner,
            status: 'AT_FARM',
            quantity,
        };

        batch.status = 'READY_FOR_DELIVERY'

        console.log(`Batch ${batchId} created and linked to order ${orderId}`);

        order.batchIds.push(batchId);
        order.status = 'IN_PROGRESS'
        await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(order)));

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
    }

    // ===== 3. Ship batch to next org =====
    @Transaction()
    public async shipBatch(ctx: Context, batchId: string, productOwner: string): Promise<void> {
        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }
        const batch: Batch = JSON.parse(batchBytes.toString());

        const orderId = batch.orderId
        const orderBytes = await ctx.stub.getState(orderId);

        if (!orderBytes || orderBytes.length === 0) {
            throw new Error(`Batch ${orderId} does not exist`);
        }

        batch.status = 'IN_TRANSIT';
        batch.productOwner = productOwner

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
    }

    // ===== 4. Update temperature and humidity during transport =====
    @Transaction()
    public async updateTemperatureAndHumidity(
        ctx: Context,
        batchId: string,
        temperature: number,
        humidity: number
    ): Promise<void> {
        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch: Batch = JSON.parse(batchBytes.toString());
        batch.temperature = temperature;
        batch.humidity = humidity;

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
    }

    // ===== 5. Deliver batch =====
    @Transaction()
    public async deliverBatch(ctx: Context, batchId: string, productOwner: string): Promise<void> {
        
        // Batch
        const batchBytes = await ctx.stub.getState(batchId);

        if (!batchBytes) {
            throw new Error(`Batch does not exist`);
        }

        const batch: Batch = JSON.parse(batchBytes.toString());

        // Order
        const orderBytes = await ctx.stub.getState(batch.orderId);

        if (!orderBytes) {
            throw new Error(`Order does not exist`);
        }

        const order: Order = JSON.parse(orderBytes.toString());

        if (batch.status !== 'IN_TRANSIT') {
            throw new Error(`Batch ${batchId} is not in transit`);
        }

        batch.status = 'DELIVERED';
        batch.productOwner = productOwner;

        // Update order status if all batches delivered
        const allDelivered = order.batchIds.every((id) => id === batchId || batch.status === 'DELIVERED');
        if (allDelivered) {

            let totalQuantity = 0;

            for (const batchId of order.batchIds) {
                const batchBytes = await ctx.stub.getState(batchId);
                if (!batchBytes || batchBytes.length === 0) {
                    throw new Error(`Batch ${batchId} does not exist`);
                }

                const batch: Batch = JSON.parse(batchBytes.toString());
                totalQuantity += batch.quantity;
            }

            console.log(`Total batch quantity: ${totalQuantity}, required: ${order.quantity}`);

            // Jeśli suma ilości batchy == ilość z zamówienia
            if (totalQuantity >= order.quantity) {
                order.status = 'ORDER_FULLFILLED';
            } else {
                console.log(`Order ${order.orderId} not ready — only ${totalQuantity}/${order.quantity} prepared`);
            }

            await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
            await ctx.stub.putState(order.orderId, Buffer.from(JSON.stringify(order)));
        }
    }

    // ===== 6. Query functions =====
    @Transaction(false)
    public async queryOrder(ctx: Context, orderId: string): Promise<string> {
        const orderBytes = await ctx.stub.getState(orderId);
        if (!orderBytes || orderBytes.length === 0) {
            throw new Error(`Order ${orderId} does not exist`);
        }
        return orderBytes.toString();
    }

    @Transaction(false)
    public async queryBatch(ctx: Context, batchId: string): Promise<string> {
        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }
        return batchBytes.toString();
    }

    @Transaction(false)
    public async getBatchHistory(ctx: Context, batchId: string): Promise<any[]> {
        const iterator = await ctx.stub.getHistoryForKey(batchId);
        const allResults = [];

        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const record = {
                    txId: res.value.txId,
                    timestamp: res.value.timestamp,
                    value: JSON.parse(res.value.value.toString()),
                    isDelete: res.value.isDelete
                };
                allResults.push(record);
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
        return allResults;
    }

    @Transaction(false)
    public async getOrderHistory(ctx: Context, orderId: string): Promise<any[]> {
        const iterator = await ctx.stub.getHistoryForKey(orderId);
        const allResults = [];

        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const record = {
                    txId: res.value.txId,
                    timestamp: res.value.timestamp,
                    value: JSON.parse(res.value.value.toString()),
                    isDelete: res.value.isDelete
                };
                allResults.push(record);
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }

        return allResults;
    }

}
