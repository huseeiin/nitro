import { renderToStringAsync, HydrationScript, ssr } from "solid-js/web";
import { App } from "./app.jsx";

// @ts-ignore
import clientAssets from "./entry-client?assets=client";

// @ts-ignore
import serverAssets from "./entry-server?assets=ssr";

export default {
  async fetch(req: Request): Promise<Response> {
    const appHTML = await renderToStringAsync(() => <App />);
    const rootHTML = await renderToStringAsync(() => (
      <Root appHTML={appHTML} />
    ));
    return new Response(rootHTML, {
      headers: { "Content-Type": "text/html" },
    });
  },
};

function Root(props: { appHTML?: string }) {
  const assets = clientAssets.merge(serverAssets);
  return (
    <>
      {ssr("<!DOCTYPE html>")}
      <html lang="en">
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          {assets.css.map((attr: any) => (
            <link key={attr.href} rel="stylesheet" {...attr} />
          ))}
          {assets.js.map((attr: any) => (
            <link key={attr.href} type="modulepreload" {...attr} />
          ))}
          <HydrationScript />
        </head>
        <body>
          <div id="app" innerHTML={props.appHTML || ""} />
          <script type="module" src={assets.entry} />
        </body>
      </html>
    </>
  );
}
