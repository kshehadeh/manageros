import type { Widget } from './types'

/**
 * Widget registry - stores all available widgets
 */
class WidgetRegistry {
  private widgets: Map<string, Widget> = new Map()

  /**
   * Register a widget
   */
  register(widget: Widget): void {
    if (this.widgets.has(widget.metadata.id)) {
      console.warn(
        `Widget with id "${widget.metadata.id}" is already registered. Overwriting.`
      )
    }
    this.widgets.set(widget.metadata.id, widget)
  }

  /**
   * Register multiple widgets
   */
  registerAll(widgets: Widget[]): void {
    widgets.forEach(widget => this.register(widget))
  }

  /**
   * Get a widget by ID
   */
  get(id: string): Widget | undefined {
    return this.widgets.get(id)
  }

  /**
   * Get all registered widgets
   */
  getAll(): Widget[] {
    return Array.from(this.widgets.values())
  }

  /**
   * Get widgets by category
   */
  getByCategory(category: string): Widget[] {
    return this.getAll().filter(widget => widget.metadata.category === category)
  }

  /**
   * Check if a widget is registered
   */
  has(id: string): boolean {
    return this.widgets.has(id)
  }
}

// Singleton instance
export const widgetRegistry = new WidgetRegistry()
