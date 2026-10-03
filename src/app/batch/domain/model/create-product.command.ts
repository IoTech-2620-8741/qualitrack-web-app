/**
 * Intent to register a pharmaceutical product in the environment taken from the route (US71).
 */
export interface CreateProductCommand {
  /** Internal catalog code, unique in the laboratory (maximum 50 characters). */
  code: string;
  /** Product name, unique in the laboratory (maximum 150 characters). */
  name: string;
  /** Optional description (maximum 500 characters). */
  description: string | null;
  /** Technical specifications (maximum 1000 characters). */
  specifications: string;
}
