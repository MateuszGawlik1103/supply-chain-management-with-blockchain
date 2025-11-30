import { Object, Property } from 'fabric-contract-api';

@Object()
export class Batch {
  @Property()
  public docType?: string = 'batch';
  
  @Property()
  public batchId: string = '';

  @Property()
  public originFarm: string = '';

  @Property()
  public orderId: string = '';

  @Property()
  public productOwner: string = '';

  @Property()
  public status: string = 'AT_FARM';

  @Property()
  public quantity: number = 0;

  @Property()
  public temperature?: number | null;

  @Property()
  public humidity?: number | null;

  @Property()
  public transport?: string | null;

  @Property()
  public location?: string;

  @Property()
  public qualityCheck?: string;

  @Property()
  public packagingType?: string;

  @Property()
  public roastLevel?: string;
}
