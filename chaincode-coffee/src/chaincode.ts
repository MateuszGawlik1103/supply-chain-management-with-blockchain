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

    // ===== 2. Prepare product for delivery =====
    @Transaction()
    public async prepareProductForDelivery(
        ctx: Context,
        orderId: string,
        batchId: string
    ): Promise<void> {
        const orderBytes = await ctx.stub.getState(orderId);
        if (!orderBytes || orderBytes.length === 0) {
            throw new Error(`Order ${orderId} does not exist`);
        }

        const order: Order = JSON.parse(orderBytes.toString());

        if (order.status !== 'ORDER_PLACED') {
            throw new Error(`Order ${orderId} is not in ORDER_PLACED state`);
        }

        order.status = 'READY_FOR_DELIVERY';
        order.batchIds.push(batchId);

        const batch = new Batch();
        batch.batchId = batchId;
        batch.status = 'READY_FOR_DELIVERY';

        await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(order)));
        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
    }

    // ===== 3. Ship batch to next org =====
    @Transaction()
    public async shipBatch(ctx: Context, batchId: string): Promise<void> {
        const batchBytes = await ctx.stub.getState(batchId);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch: Batch = JSON.parse(batchBytes.toString());

        if (batch.status !== 'READY_FOR_DELIVERY') {
            throw new Error(`Batch ${batchId} is not ready for delivery`);
        }

        batch.status = 'IN_TRANSIT';
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
    public async deliverBatch(ctx: Context, orderId: string, batchId: string): Promise<void> {
        const orderBytes = await ctx.stub.getState(orderId);
        const batchBytes = await ctx.stub.getState(batchId);

        if (!orderBytes || !batchBytes) {
            throw new Error(`Order or Batch does not exist`);
        }

        const order: Order = JSON.parse(orderBytes.toString());
        const batch: Batch = JSON.parse(batchBytes.toString());

        if (batch.status !== 'IN_TRANSIT') {
            throw new Error(`Batch ${batchId} is not in transit`);
        }

        batch.status = 'DELIVERED';

        // Update order status if all batches delivered
        const allDelivered = order.batchIds.every((id) => id === batchId || batch.status === 'DELIVERED');
        if (allDelivered) {
            order.status = 'DELIVERED';
        }

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));
        await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(order)));
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
}
