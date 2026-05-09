export interface DiamondStone {
  lotNumber: string;
  shape: string;
  measurements: string;
  length: number;
  width: number;
  ratio: number;
  color: string;
  clarity: string;
  stoneWeight: number;
  pricePerCarat: number;
  totalPrice: number;
}

export interface DiamondPair {
  setNumber: string;
  stones: DiamondStone[];
  totalWeight: number;
  pricePerCarat: number;
  totalPrice: number;
}
