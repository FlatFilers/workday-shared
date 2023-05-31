// import { Client } from '../Client'
// import { Blueprint } from '@flatfile/api'
// import { Agent } from '@flatfile/configure'

// type IConfigureOptions = { environmentId?: string; createSpaces?: boolean }

// // TODO: first pass at useConfigure Plugin. Does not register hooks, only deploys the spaceConfig
// export const useConfigure = (agent: Agent, options?: IConfigureOptions) => {
//   const configure = async (client: Client) => {
//     const {
//       options: { spaceConfigs },
//     } = agent
//     for (const slug in spaceConfigs) {
//       const spaceConfig = spaceConfigs[slug]

//       try {
//         const spacePatternConfig = {
//           name: spaceConfig.options.name,
//           // TODO Do we need a unique slug for this in the Platform SDK or X? Should we generate them in X?
//           slug,
//           blueprints: mapObj(
//             spaceConfig.options.workbookConfigs,
//             (wb, wbSlug, i) => {
//               return {
//                 name: wb.options.name,
//                 slug: `${slug}/${wbSlug}`,
//                 primary: i === 0,
//                 sheets: mapObj(wb.options.sheets, (model, modelSlug) =>
//                   model.toBlueprint(wbSlug, modelSlug)
//                 ),
//               } as Blueprint
//             }
//           ),
//         }
//         const spaceConfigRes = await client.api.addSpaceConfig({
//           spacePatternConfig,
//         })

//         const spaceConfigId = spaceConfigRes?.data?.id || ''

//         if (options?.createSpaces && options.environmentId) {
//           try {
//             const space = await client.api.addSpace({
//               spaceConfig: {
//                 spaceConfigId,
//                 environmentId: options.environmentId,
//                 name: spaceConfig.options.name,
//               },
//             })
//           } catch (e) {
//             console.log(`Error Creating Space error: ${e}`)
//           }
//         }
//       } catch (e) {
//         console.log(`Error Creating Space Config: ${e}`)
//       }
//     }
//   }
//   return configure
// }

// function mapObj<T, K>(
//   obj: Record<string, K>,
//   cb: (value: K, key: string, i: number) => T
// ): T[] {
//   const slugs = Object.keys(obj)
//   let i = 0
//   return slugs.map((slug) => {
//     const model = obj[slug]
//     return cb(model, slug, i++)
//   })
// }
