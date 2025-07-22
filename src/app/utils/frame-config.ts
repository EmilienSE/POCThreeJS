import { OpeningDirection } from "./opening-direction.enum";
import { Shapes } from "./shapes";

export interface FrameConfig {
  openingDirection: OpeningDirection;
  width: number;
  height: number;
  lowHeight?: number;
  shape: Shapes;
  horizontalGlazingBarsNb: number;
  verticalGlazingBarsNb: number;
  railNb: number;
  stileNb: number;
}
