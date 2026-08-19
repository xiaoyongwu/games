/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { visit } from 'unist-util-visit'
import * as yaml from 'js-yaml'
import { buildErrorMessage } from '../../src/util.js'
import rules from './rules.js'

const source = 'remark-elastic-frontmatter'

export default function remarkElasticFrontmatter () {
  return (tree, file) => {
    visit(tree, (node) => {
      if (node.type === 'yaml') {
        const frontmatter = yaml.load(node.value)
        /** Check for all required fields */
        const requiredFields = [
          'id',
          // 'slug',
          'title'
        ]
        const missingFields = requiredFields.filter(key => {
          return !Object.keys(frontmatter).includes(key)
        })
        if (missingFields.length > 0) {
          missingFields.forEach(field => {
            buildErrorMessage(
              `missing-${field}`,
              rules,
              `Missing frontmatter \`${field}\``,
              node,
              source,
              file
            )
          })
        }
        /** Validate ID */
        if (frontmatter.id) {
          const validId = /^[^ ]+$/m.test(frontmatter.id)
          if (!validId) {
            buildErrorMessage(
              'invalid-id',
              rules,
              `\`${frontmatter.id}\` cannot contain spaces`,
              node,
              source,
              file
            )
          }
        }
        /** Validate slug */
        if (frontmatter.slug) {
          const startOfSlug = frontmatter.slug.charAt(0) === '/'
          const slugContent = /^[^ ]+$/m.test(frontmatter.slug)
          const validSlug = startOfSlug && slugContent
          if (!validSlug) {
            if (!startOfSlug) {
              buildErrorMessage(
                'invalid-slug-start',
                rules,
                `\`${frontmatter.slug}\` must begin with \`/\``,
                node,
                source,
                file
              )
            }
            if (!slugContent) {
              buildErrorMessage(
                'invalid-slug',
                rules,
                `\`${frontmatter.slug}\` cannot contain spaces`,
                node,
                source,
                file
              )
            }
          }
        }
        /** Validate date */
        if (frontmatter.date) {
          const validDate =
            (
              typeof frontmatter.date === 'object' ||
              (typeof frontmatter.date === 'string' && /^\d{4}-\d{1,2}-\d{1,2}$/m.test(frontmatter.date))
            ) &&
            (new Date(frontmatter.date)).getTime() > 0
          if (!validDate) {
            buildErrorMessage(
              'invalid-date',
              rules,
              `\`${frontmatter.date}\` must be in \`YYYY-MM-DD\` format`,
              node,
              source,
              file
            )
          }
        }
        /** Validate tags */
        // if (frontmatter.tags) {
        //   const validTags = Array.isArray(frontmatter.tags)
        //   if (!validTags) {
        //     buildErrorMessage (
        //       'invalid-tags',
        //       rules,
        //       'Frontmatter `tags` must be an array',
        //       node,
        //       source,
        //       file
        //     )
        //   }
        // }
      }
    })
  }
}
