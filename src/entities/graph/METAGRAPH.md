# What is a Metagraph?

A metagraph is a data structure consisting of four kinds of elements:
**vertices**, **edges**, **metavertices**, and **metaedges**.

## Vertices

A vertex is the simplest element. It has an ID and a set of key-value
attributes. It does not contain other elements.

## Edges

An edge connects exactly two vertices or metavertices (source and target).
An edge can be **directed** or **undirected**. Like vertices, edges carry
their own attributes.

## Metavertices

A metavertex is like a vertex, but it also **contains** other elements:

- Vertices and/or metavertices (nested arbitrarily deep)
- Edges and/or metaedges, each of which **must be undirected**

A metavertex has its own attributes in addition to its children.

## Metaedges

A metaedge is like an edge (it connects two vertices or metavertices), but
it also **contains** other elements:

- Vertices and/or metavertices
- Edges and/or metaedges, each of which **must be directed**

A metaedge is always directed. It carries its own attributes in addition to
its children.

## Containment Rules Summary

| Container   | May contain vertices/metavertices? | May contain edges/metaedges?         |
|-------------|-------------------------------------|--------------------------------------|
| Metavertex  | Yes                                 | Yes, but only **undirected** ones    |
| Metaedge    | Yes                                 | Yes, but only **directed** ones      |

An element can belong to **multiple** parent containers (metavertices or
metaedges) simultaneously.

## How This Maps to the Codebase

- All four element types are stored in a single `Map<string, GraphElement>`.
- Edges store `source` and `target` IDs as intrinsic properties.
- Parent/child containment and node-edge reverse lookups are tracked in
  separate **relation maps** (`Map<string, Set<GraphElement>>`), keeping
  the element objects themselves clean of relationship data.

See `model/types.ts` for the TypeScript definitions and `model/graphStore.ts`
for the store implementation.
