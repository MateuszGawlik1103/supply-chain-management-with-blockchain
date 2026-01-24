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
        description: string,
        quantity: number,
        orderingOrg: string,
        expectedDelivery: string
    ): Promise<void> {
        // Check if user is authorized to execute this function
        const canWrite  = ctx.clientIdentity.getAttributeValue('canWrite');
        // Check if organization is authorized to execute this function
        const organization  = ctx.clientIdentity.getAttributeValue('organization');

        if (organization !== "org3") {
            throw new Error('This organization is not authorized to execute this transaction!');
        }
        
        if (canWrite !== "1") {
            throw new Error('Not authorized to write!');
        }

        const exists = await ctx.stub.getState(orderId);
        if (exists && exists.length > 0) {
            throw new Error(`Order already exists: ${orderId}`);
        }

        const order = new Order();
        order.orderId = orderId;
        order.coffeeType = coffeeType;
        order.quantity = quantity;
        order.orderingOrg = orderingOrg;
        order.description = description;

        const txTimestamp = await ctx.stub.getTxTimestamp();
        const orderDate = new Date(txTimestamp.seconds.low * 1000).toISOString();
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
        originFarm: string,
        orderId: string,
        quantity: number,
        productOwner: string
    ): Promise<void> {
        // Check if user is authorized to execute this function
        const canWrite  = ctx.clientIdentity.getAttributeValue('canWrite');
        // Check if organization is authorized to execute this function
        const organization  = ctx.clientIdentity.getAttributeValue('organization');

        if (organization !== "org1") {
            throw new Error('This organization is not authorized to execute this transaction!');
        }
        
        if (canWrite !== "1") {
            throw new Error('Not authorized to write!');
        }

        const existingBatch = await ctx.stub.getState(batchId);
        if (existingBatch && existingBatch.length > 0) {
            throw new Error(`Batch ${batchId} already exists`);
        }

        const orderBytes = await ctx.stub.getState(orderId);
        if (!orderBytes || orderBytes.length === 0) {
            throw new Error(`Order ${orderId} not found`);
        }

        const order: Order = JSON.parse(orderBytes.toString());

        const batch: Batch = {
            docType: 'batch',
            batchId,
            orderId,
            productOwner,
            status: 'AT_FARM',
            quantity,
            originFarm
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
    public async shipBatch(
        ctx: Context,
        batchId: string,
        productOwner: string,
        transport: string
    ): Promise<void> {
        // Check if user is authorized to execute this function
        const canWrite  = ctx.clientIdentity.getAttributeValue('canWrite');
        // Check if organization is authorized to execute this function
        const organization  = ctx.clientIdentity.getAttributeValue('organization');

        if (organization !== "org2") {
            throw new Error('This organization is not authorized to execute this transaction!');
        }
        
        if (canWrite !== "1") {
            throw new Error('Not authorized to write!');
        }

        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Batch ${batchId} not found`);
        }
        const batch: Batch = JSON.parse(batchBytes.toString());

        if (batch.status !== 'READY_FOR_DELIVERY') {
            throw new Error(`Batch ${batchId} is not in READY_FOR_DELIVERY status`);
        }

        const orderId = batch.orderId
        const orderBytes = await ctx.stub.getState(orderId);

        if (!orderBytes || orderBytes.length === 0) {
            throw new Error(`Order ${orderId} not found`);
        }

        batch.status = 'IN_TRANSIT';
        batch.productOwner = productOwner;
        batch.transport = transport;

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
        // Check if user is authorized to execute this function
        const canWrite  = ctx.clientIdentity.getAttributeValue('canWrite');
        // Check if organization is authorized to execute this function
        const organization  = ctx.clientIdentity.getAttributeValue('organization');

        if (organization !== "org2") {
            throw new Error('This organization is not authorized to execute this transaction!');
        }
        
        if (canWrite !== "1") {
            throw new Error('Not authorized to write!');
        }

        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Batch ${batchId} not found`);
        }

        const batch: Batch = JSON.parse(batchBytes.toString());

        if (batch.status !== 'IN_TRANSIT') {
            throw new Error(`Batch ${batchId} is not in transit`);
        }

        batch.temperature = temperature;
        batch.humidity = humidity;

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
    }

    // ===== 5. Deliver batch =====
    @Transaction()
    public async deliverBatch(
        ctx: Context, 
        batchId: string, 
        productOwner: string,
        location: string,
        qualityCheck: string,
        packagingType: string,
        roastLevel: string,
        displayName: string
    ): Promise<void> {

        const canWrite  = ctx.clientIdentity.getAttributeValue('canWrite');
        const organization  = ctx.clientIdentity.getAttributeValue('organization');

        if (organization !== "org3") {
            throw new Error('This organization is not authorized to execute this transaction!');
        }
        
        if (canWrite !== "1") {
            throw new Error('Not authorized to write!');
        }

        // --- Read batch ---
        const batchBytes = await ctx.stub.getState(batchId);

        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Batch not found`);
        }

        const batch: Batch = JSON.parse(batchBytes.toString());

        // --- Read order ---
        const orderBytes = await ctx.stub.getState(batch.orderId);

        if (!orderBytes || orderBytes.length === 0) {
            throw new Error(`Order not found`);
        }

        const order: Order = JSON.parse(orderBytes.toString());

        if (batch.status !== 'IN_TRANSIT') {
            throw new Error(`Batch ${batchId} is not in transit`);
        }

        // ----- UPDATE BATCH -----
        batch.status = 'DELIVERED';
        batch.productOwner = productOwner;

        batch.temperature = null;
        batch.humidity = null;
        batch.transport = null;

        batch.location = location;
        batch.qualityCheck = qualityCheck;
        batch.packagingType = packagingType;
        batch.roastLevel = roastLevel;
        batch.displayName = displayName;

        // ----- UPDATE ORDER -----
        const allDelivered = order.batchIds.every((id) => id === batchId || batch.status === 'DELIVERED');

        if (allDelivered) {
            let totalQuantity = 0;

            for (const batchId of order.batchIds) {
                const batchBytes = await ctx.stub.getState(batchId);

                if (!batchBytes || batchBytes.length === 0) {
                    throw new Error(`Batch ${batchId} not found`);
                }

                const b: Batch = JSON.parse(batchBytes.toString());
                totalQuantity += b.quantity;
            }

            if (totalQuantity >= order.quantity) {
                order.status = 'ORDER_FULLFILLED';
            } else {
                console.log(`Order ${order.orderId} not ready — only ${totalQuantity}/${order.quantity} prepared`);
            }
        }

        // Save updates
        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
        await ctx.stub.putState(order.orderId, Buffer.from(JSON.stringify(order)));
    }


    // ===== 6. Query functions =====
    @Transaction(false)
    public async queryOrder(
        ctx: Context,
        orderId: string,
    ): Promise<string> {
        const bytes = await ctx.stub.getState(orderId);

        if (!bytes || bytes.length === 0) {
            throw new Error(`Order ${orderId} not found`);
        }

        const obj = JSON.parse(bytes.toString());

        if (obj.docType !== 'order') {
            throw new Error(`Order ${orderId} not found`);
        }

        return bytes.toString();
    }

    @Transaction(false)
    public async queryBatch(ctx: Context, batchId: string): Promise<string> {
        const bytes = await ctx.stub.getState(batchId);

        if (!bytes || bytes.length === 0) {
            throw new Error(`Batch ${batchId} not found`);
        }

        const obj = JSON.parse(bytes.toString());

        if (obj.docType !== 'batch') {
            throw new Error(`Batch ${batchId} not found`);
        }

        return bytes.toString();
    }

    @Transaction(false)
    public async getBatchHistory(ctx: Context, batchId: string): Promise<any[]> {
        const iterator = await ctx.stub.getHistoryForKey(batchId);
        const allResults = [];

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const parsed = JSON.parse(res.value.value.toString());

                if (parsed.docType !== 'batch') {
                    throw new Error(`Batch ${batchId} not found`);
                }

                const record = {
                    txId: res.value.txId,
                    timestamp: res.value.timestamp,
                    value: parsed,
                    isDelete: res.value.isDelete
                };

                allResults.push(record);
            }

            if (res.done) {
                await iterator.close();
                break;
            }
        }

        if (allResults.length === 0) {
            throw new Error(`Batch ${batchId} not found`);
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
                const parsed = JSON.parse(res.value.value.toString());

                if (parsed.docType !== 'order') {
                    throw new Error(
                        `Key ${orderId} history contains non-order entry (found '${parsed.docType}')`
                    );
                }

                const record = {
                    txId: res.value.txId,
                    timestamp: res.value.timestamp,
                    value: parsed,
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
