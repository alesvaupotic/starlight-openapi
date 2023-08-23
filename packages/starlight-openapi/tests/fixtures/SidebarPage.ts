import type { Locator, Page } from '@playwright/test'

export class SidebarPage {
  constructor(public readonly page: Page) {}

  goto() {
    return this.page.goto('/guides/getting-started/')
  }

  getSidebarGroupItems(label: string) {
    return this.#getSidebarChildrenItems(this.#getSidebarRootDetails(label).locator('> ul'))
  }

  get #sidebar() {
    return this.page.getByRole('navigation', { name: 'Main' }).locator('div.sidebar')
  }

  #getSidebarRootDetails(label: string) {
    return this.#sidebar.getByRole('listitem').locator(`details:has(summary > h2:text-is("${label}"))`).last()
  }

  async #getSidebarChildrenItems(list: Locator): Promise<SidebarItem[]> {
    const items: SidebarItem[] = []

    for (const item of await list.locator('> li > :is(a, details)').all()) {
      const href = await item.getAttribute('href')

      if (href) {
        const name = await item.textContent()

        items.push({ name: name ? name.trim() : null })
      } else {
        await this.page.pause()
        items.push({
          collapsed: (await item.getAttribute('open')) === null,
          label: await item.locator(`> summary > h2`).textContent(),
          items: await this.#getSidebarChildrenItems(item.locator('> ul')),
        })
      }
    }

    return items
  }
}

type SidebarItem = SidebarItemGroup | SidebarItemLink

interface SidebarItemLink {
  name: string | null
}

interface SidebarItemGroup {
  collapsed: boolean
  items: (SidebarItemGroup | SidebarItemLink)[]
  label: string | null
}
