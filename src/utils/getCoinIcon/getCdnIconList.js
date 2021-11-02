export const getCdnIconList = async () => {
  const response = await fetch(`${process.env.REACT_APP_ICON_CDN_URL}/list.json`);

  if (response.ok) {
    return await response.json();
  }
}