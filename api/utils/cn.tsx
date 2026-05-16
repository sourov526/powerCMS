export default function CN(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}
