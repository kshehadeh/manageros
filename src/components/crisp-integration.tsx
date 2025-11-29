export function CrispIntegration() {
  return (
    <div>
      <script
        type='text/javascript'
        dangerouslySetInnerHTML={{
          __html: `window.$crisp=[];window.CRISP_WEBSITE_ID="753eccea-4739-4c62-856f-c1f7c6956aae";(function(){d = document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`,
        }}
      />
    </div>
  )
}
