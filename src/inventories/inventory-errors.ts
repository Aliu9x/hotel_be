export enum InventoryErrorCode {
  NOT_FOUND = 'INVENTORY_NOT_FOUND',
  RANGE_INCOMPLETE = 'INVENTORY_RANGE_INCOMPLETE',
  STOP_SELL = 'STOP_SELL',
  INSUFFICIENT_AVAILABLE = 'INSUFFICIENT_AVAILABLE',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  CANCEL_EXCEEDS_SOLD = 'CANCEL_EXCEEDS_SOLD',
}

export class InventoryException extends Error {
  constructor(
    public readonly code: InventoryErrorCode,
    public readonly message: string,
    public readonly context?: any,
  ) {
    super(message);
  }
}