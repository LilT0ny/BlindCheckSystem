export const buildFileUrl = (archivo_url) => {
  if (!archivo_url) return '';
  if (/^https?:\/\//i.test(archivo_url)) return archivo_url;

  // Caso típico: backend devuelve "/media/xxx.jpg" o "/uploads/xxx.jpg"
  return `${window.location.origin}${archivo_url}`;
};
