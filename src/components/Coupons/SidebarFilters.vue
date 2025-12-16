<!-- src/components/Coupons/SidebarFilters.vue -->
<template>
  <aside class="sidebar-filters" :class="{ collapsed: isCollapsed }">
    <div class="filter-header">
      <h3>Filter Coupons</h3>
      <!-- On mobile, this button toggles the filters -->
      <button class="toggle-btn" @click="toggleCollapse">
        {{ isCollapsed ? "Show Filters" : "Hide Filters" }}
      </button>
    </div>
    <transition name="collapse">
      <div v-if="!isCollapsed" class="filter-content">
        <!-- 🔎 Primary keyword search -->
        <div class="filter-group">
          <label for="keyword">Search:</label>
          <input
            id="keyword"
            type="text"
            v-model="keyword"
            @input="applyFilter"
            placeholder="Search by merchant, title, or description"
          />
        </div>

        <!-- Filter by Cuisine Type -->
        <div class="filter-group">
          <label for="cuisineType">Cuisine Type:</label>
          <!-- Desktop: dropdown with clear button -->
          <div class="select-wrapper hide-mobile">
            <select id="cuisineType" v-model="cuisineType" @change="applyFilter">
              <option value="">All</option>
              <option 
                v-for="option in cuisineOptions" 
                :key="option.value" 
                :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <button 
              v-if="cuisineType" 
              class="clear-btn" 
              @click="clearCuisine"
              type="button"
              aria-label="Clear cuisine filter">
              &times;
            </button>
          </div>
          <!-- Mobile: tappable chip list -->
          <div class="filter-chips show-mobile">
            <button
              v-for="option in cuisineOptions"
              :key="option.value"
              :class="['chip', { active: cuisineType === option.value }]"
              @click="toggleCuisine(option.value)"
              type="button">
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- Checkbox for active coupons -->
        <div class="filter-group">
          <label>
            <input type="checkbox" v-model="activeOnly" @change="applyFilter" />
            Show Active Coupons Only
          </label>
        </div>

        <!-- Filter by Coupon Type -->
        <div class="filter-group">
          <label for="couponType">Coupon Type:</label>
          <!-- Desktop: dropdown with clear button -->
          <div class="select-wrapper hide-mobile">
            <select id="couponType" v-model="couponType" @change="applyFilter">
              <option value="">All</option>
              <option 
                v-for="option in couponTypeOptions" 
                :key="option.value" 
                :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <button 
              v-if="couponType" 
              class="clear-btn" 
              @click="clearCouponType"
              type="button"
              aria-label="Clear coupon type filter">
              &times;
            </button>
          </div>
          <!-- Mobile: tappable chip list -->
          <div class="filter-chips show-mobile">
            <button
              v-for="option in couponTypeOptions"
              :key="option.value"
              :class="['chip', { active: couponType === option.value }]"
              @click="toggleCouponType(option.value)"
              type="button">
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </aside>
</template>

<script>
export default {
  name: "SidebarFilters",
  data() {
    return {
      keyword: "",
      activeOnly: false,
      couponType: "",
      cuisineType: "",
      isCollapsed: false,
      // Options arrays for reuse in both select and chips
      cuisineOptions: [
        { value: "Italian", label: "Italian" },
        { value: "French", label: "French" },
        { value: "Cafe", label: "Cafe" },
        { value: "Modern American", label: "Modern American" },
        { value: "Contemporary", label: "Contemporary" },
        { value: "Fast Food", label: "Fast Food" },
        { value: "Fusion", label: "Fusion" },
        { value: "Dessert", label: "Dessert" },
        { value: "Romantic", label: "Romantic" },
        { value: "Appetizers", label: "Appetizers" },
        { value: "Breakfast", label: "Breakfast" },
        { value: "Bar & Grill", label: "Bar & Grill" },
        { value: "Brunch", label: "Brunch" },
        { value: "Casual Dining", label: "Casual Dining" },
        { value: "Diner", label: "Diner" },
        { value: "Seasonal", label: "Seasonal" },
        { value: "Family", label: "Family" }
      ],
      couponTypeOptions: [
        { value: "percentage", label: "Percentage" },
        { value: "bogo", label: "BOGO" },
        { value: "free", label: "Free" }
      ]
    };
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },
    applyFilter() {
      // Emit current filter criteria upward
      this.$emit("filter-changed", {
        keyword: this.keyword,
        activeOnly: this.activeOnly,
        couponType: this.couponType,
        cuisineType: this.cuisineType
      });
    },
    // Toggle methods for mobile chip selection
    toggleCuisine(value) {
      this.cuisineType = this.cuisineType === value ? "" : value;
      this.applyFilter();
    },
    toggleCouponType(value) {
      this.couponType = this.couponType === value ? "" : value;
      this.applyFilter();
    },
    // Clear methods for desktop dropdowns
    clearCuisine() {
      this.cuisineType = "";
      this.applyFilter();
    },
    clearCouponType() {
      this.couponType = "";
      this.applyFilter();
    }
  }
};
</script>

<style scoped>
.sidebar-filters {
  width: 250px;
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  margin-bottom: var(--spacing-lg);
}
.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-header h3 {
  margin: 0;
  font-size: var(--font-size-xl);
}
.toggle-btn {
  background: none;
  border: none;
  font-size: var(--font-size-sm);
  color: var(--color-secondary);
  cursor: pointer;
  transition: color var(--transition-fast);
}
.toggle-btn:hover {
  color: var(--color-secondary-hover);
}
.filter-content {
  margin-top: var(--spacing-lg);
}
.filter-group {
  margin-bottom: var(--spacing-md);
}
.filter-group label {
  display: block;
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
}
.filter-group input[type="text"],
.filter-group select {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family-base);
  transition: border-color var(--transition-fast);
}
.filter-group input[type="text"]:focus,
.filter-group select:focus {
  outline: none;
  border-color: var(--color-secondary);
}
.collapse-enter-active,
.collapse-leave-active {
  transition: all var(--transition-slow);
}
.collapse-enter,
.collapse-leave-to {
  opacity: 0;
  height: 0;
  overflow: hidden;
}
@media (max-width: 480px) {
  .sidebar-filters {
    width: 100%;
    margin-bottom: var(--spacing-lg);
  }
}

/* Select wrapper for positioning clear button */
.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.select-wrapper select {
  flex: 1;
  padding-right: var(--spacing-xl);
}

/* Clear button for desktop dropdowns */
.clear-btn {
  position: absolute;
  right: var(--spacing-sm);
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0 var(--spacing-xs);
  line-height: 1;
  transition: color var(--transition-fast);
}
.clear-btn:hover {
  color: var(--color-danger);
}

/* Mobile chip/button list */
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}
.chip {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full, 9999px);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.chip:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
}
.chip.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Responsive visibility utilities (scoped) */
.hide-mobile {
  display: flex;
}
.show-mobile {
  display: none;
}

@media (max-width: 768px) {
  .hide-mobile {
    display: none !important;
  }
  .show-mobile {
    display: flex !important;
  }
}
</style>
