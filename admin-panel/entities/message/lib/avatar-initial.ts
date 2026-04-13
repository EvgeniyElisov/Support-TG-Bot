type AvatarSource = {
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

/** Одна буква для аватар-плашки в списке диалогов */
export function getAvatarInitial(source: AvatarSource): string {
  const u = source.username?.trim();
  if (u && u.length > 0) {
    return u[0]!.toUpperCase();
  }
  const fn = source.first_name?.trim();
  if (fn && fn.length > 0) {
    return fn[0]!.toUpperCase();
  }
  const ln = source.last_name?.trim();
  if (ln && ln.length > 0) {
    return ln[0]!.toUpperCase();
  }
  return "?";
}
