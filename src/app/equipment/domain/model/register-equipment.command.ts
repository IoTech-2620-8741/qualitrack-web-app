/** Registration of an equipment in the current laboratory (US45). */
export interface RegisterEquipmentCommand {
  name: string;
  type: string;
  model: string;
  serialNumber: string;
}
