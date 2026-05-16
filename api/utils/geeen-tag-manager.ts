function parseNumericId(value?: string | null) {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;
  return /^\d+$/.test(trimmed) ? trimmed : null;
}

export function getGeeeNTagManagerId() {
  return parseNumericId(process.env.NEXT_PUBLIC_GEEEN_TAG_MANAGER_ID) || null;
}

export function buildGeeeNTagManagerBootstrap(tagManagerId: string) {
  return `(function(i,g,m,a,h){i[a]=i[a]||[];i[a].push({"geeen_tag_manger.start":new Date().getTime(),event:"js"});var k=g.getElementsByTagName(m)[0],f=g.createElement(m),b=a!="GeeeNData"?"&l="+a:"",j=encodeURIComponent(window.location.href);f.async=true;f.src="https://gntm.geeen.co.jp/Onetag/?id="+h+"&u="+j+b;k.parentNode.insertBefore(f,k)})(window,document,"script","GeeeNData",${tagManagerId});`;
}
