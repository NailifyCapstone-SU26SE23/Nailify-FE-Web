export function tailwindHelper(...classes) {
  return classes.filter(Boolean).join(" ");
}
