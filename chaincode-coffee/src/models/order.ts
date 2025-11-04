import { Object, Property } from 'fabric-contract-api';

@Object()
export class Order {
  @Property()
  public docType?: string = 'order';

  @Property()
  public orderId: string = '';

  @Property()
  public coffeeType: string = '';

  @Property()
  public quantity: number = 0;

  @Property()
  public orderingOrg: string = '';

  @Property()
  public orderDate: string = '';

  @Property()
  public expectedDelivery: string = '';

  @Property()
  public status: string = 'ORDER_PLACED';

  @Property('array', 'string')
  public batchIds: string[] = [];
}
