/** A recipe tag is stored lowercase; these are the only two things pages need from one. */

export function tagLabel(tag: string): string {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

export function tagHref(tag: string): string {
  return `/recipes/tag/${encodeURIComponent(tag)}`;
}
