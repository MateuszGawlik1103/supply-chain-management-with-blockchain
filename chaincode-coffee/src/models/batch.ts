import { Object, Property } from 'fabric-contract-api';

@Object()
export class Batch {
  @Property()
  public docType?: string = 'batch';

  @Property()
  public batchId: string = '';

  @Property()
  public status: string = 'AT_FARM';

  @Property()
  public quantity: number = 0;

  @Property()
  public temperature?: number;

  @Property()
  public humidity?: number;
}
