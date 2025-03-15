import type { NitroConfig } from "nitro/types";
import type { Plugin } from "vite";
import { rm } from "node:fs/promises";
import { toNodeListener } from "h3";
import {
  copyPublicAssets,
  createNitro,
  prepare,
  prerender,
  createDevServer,
} from "../..";

import { getRollupConfig } from "../rollup/config";

export async function nitroViteEnv(_config?: NitroConfig): Promise<Plugin> {
  const nitro = await createNitro({
    renderer: ".tmp/server/ssr/ssr.js",
  });
  await prepare(nitro);
  const nitroRollupConfig = await getRollupConfig(nitro);

  const nitroDev = createDevServer(nitro);
  const nitroMiddleware = toNodeListener(nitroDev.app);

  const devURL = await nitroDev.listen(0).then((r) => r.url);

  return {
    name: "nitro",
    configEnvironment(name, config) {
      if (name === "nitro") {
        return {
          build: {
            rollupOptions: nitroRollupConfig,
          },
        };
      }
      if (config.consumer === "client") {
        return {
          build: {
            outDir: `.tmp/public`,
          },
        };
      } else {
        return {
          build: {
            outDir: `.tmp/server/${name}`,
          },
        };
      }
    },
    config() {
      return {
        build: {},
        builder: {
          async buildApp(builder) {
            await rm(".tmp", { recursive: true, force: true });

            const envNames = Object.keys(builder.environments);
            if (!envNames.includes("nitro")) {
              throw new Error("Nitro environment is required");
            }
            await copyPublicAssets(nitro);
            await prerender(nitro);
            await Promise.all(
              envNames
                .filter((env) => env !== "nitro")
                .map(
                  (envName) =>
                    [
                      envName,
                      builder.build(builder.environments[envName]),
                    ] as const
                )
            );
            await builder.build(builder.environments.nitro);
            await nitro.close();
          },
        },
      };
    },
    resolveId(id) {
      if (id === "virtual:nitro") {
        return id;
      }
    },
    async load(id, options) {
      if (this.environment.name !== "nitro" || id !== "virtual:nitro") return;

      // const content = await p.promise;
      // return generateContentFromSsrBundleOutput(content);
      return "export default {}";
    },
    generateBundle(bundle) {
      if (this.environment.name !== "ssr") return;

      console.log("generateBundle");
      // p.resolve(bundle);
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Expose it as a http://...?id= => module code
        // server.environments.ssr.moduleGraph.getModuleByUrl('')
      });
    },
  };
}
