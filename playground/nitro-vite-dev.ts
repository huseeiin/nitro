export default function ssrRender() {
  return {
    body: /* html */ "<h1>Hello, World!</h1>",
    headers: {
      "Content-Type": "text/html",
    },
  };
}
