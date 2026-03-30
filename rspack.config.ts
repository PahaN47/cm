import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import ReactRefreshPlugin from "@rspack/plugin-react-refresh";
import fs from "fs";
import path from "path";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  entry: { main: "./src/main.tsx" },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    publicPath: "/",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
                tsx: true,
              },
              transform: {
                react: {
                  runtime: "automatic",
                  development: isDev,
                  refresh: isDev,
                },
              },
            },
          },
        },
        type: "javascript/auto",
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: "sass-loader",
            options: {
              additionalData: `@use "@/shared/styles" as *;`,
              sassOptions: {
                loadPaths: [path.resolve(__dirname, "src")],
              },
            },
          },
        ],
        type: "css",
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: "./index.html",
    }),
    isDev && new ReactRefreshPlugin(),
    isDev && new rspack.HotModuleReplacementPlugin(),
  ].filter(Boolean),
  experiments: {
    css: true,
  },
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    setupMiddlewares(middlewares) {
      middlewares.unshift({
        name: "mock-api-graph",
        path: "/api/graph",
        middleware: (_req: any, res: any) => {
          const xml = fs.readFileSync(
            path.resolve(__dirname, "mock/example_courses_iu5.xml"),
            "utf-8",
          );
          res.setHeader("Content-Type", "application/xml");
          res.end(xml);
        },
      });
      return middlewares;
    },
  },
});
