import HeaderClient from "./HeaderClient";
/** Header is rendered inside I18nProvider (see layout) which carries the session user. */
export default function Header() {
  return <HeaderClient />;
}
