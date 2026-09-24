/** Country input → ISO-2 code, or null when left empty (unknown). */
export function toCountryCode(input: string): string | null {
  return input.trim().toUpperCase() || null;
}
