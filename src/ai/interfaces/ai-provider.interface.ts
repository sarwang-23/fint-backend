export interface AIProvider {
  generate(prompt: string): Promise<string>;
  generateJSON<T>(prompt: string): Promise<T>;
}
