import { ProtocolWithReturn } from "webext-bridge";
import { FileCategory } from "../commons/enums";
import { InputRequirements } from "../commons/interfaces";

declare module "webext-bridge" {
  export interface ProtocolMap {
    open_sidepanel: { raw_requirements: InputRequirements };
  }
}
