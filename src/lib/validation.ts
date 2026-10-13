/** Shared validation (used by API routes and client forms). Returns field → error code. */
export type FieldErrors = Record<string, string>;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateRegister(i: { name: string; email: string; password: string; role: string; city?: string }) {
  const e: FieldErrors = {};
  if (i.name.trim().length < 2) e.name = "min2";
  if (!EMAIL_RE.test(i.email)) e.email = "email";
  if (i.password.length < 8) e.password = "min8";
  if (i.role !== "CLIENT" && i.role !== "FREELANCER") e.role = "required";
  return e;
}
export function validatePassword(p: string) { return p.length >= 8 ? null : "min8"; }

export function validateProject(i: { title: string; description: string; category: string; budget: number; budgetMin?: number | null; budgetMax?: number | null; deadline: string; proposalDeadline?: string | null }, now = new Date()) {
  const e: FieldErrors = {};
  if (i.title.trim().length < 5) e.title = "min5";
  if (i.description.trim().length < 20) e.description = "min20";
  if (!i.category) e.category = "required";
  const hasRange = i.budgetMin != null && i.budgetMax != null && !isNaN(i.budgetMin) && !isNaN(i.budgetMax);
  if (hasRange) { if (i.budgetMin! < 1 || i.budgetMax! < i.budgetMin!) e.budget = "range"; }
  else if (!(i.budget >= 1)) e.budget = "positive";
  const today = new Date(now.toDateString());
  const d = new Date(i.deadline);
  if (isNaN(d.getTime()) || d <= today) e.deadline = "future";
  if (i.proposalDeadline) {
    const pd = new Date(i.proposalDeadline);
    if (isNaN(pd.getTime()) || pd < today) e.proposalDeadline = "future";
    else if (!e.deadline && pd > d) e.proposalDeadline = "beforeDeadline";
  }
  return e;
}
export function validateProposal(i: { price: number; deliveryDays: number; coverLetter: string }) {
  const e: FieldErrors = {};
  if (!(i.price >= 1)) e.price = "positive";
  if (!(i.deliveryDays >= 1 && i.deliveryDays <= 365)) e.deliveryDays = "days";
  if (i.coverLetter.trim().length < 20) e.coverLetter = "min20";
  return e;
}
