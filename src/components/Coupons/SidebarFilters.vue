<!--src/components/Coupons/SidebarFilters.vue-->
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
        <!-- Primary search by Merchant Name -->
        <div class="filter-group">
          <label for="merchant">Merchant Name:</label>
          <input
            id="merchant"
            type="text"
            v-model="merchantFilter"
            @input="applyFilter"
            placeholder="Search by merchant name"
          />
        </div>
        <!-- Filter by Cuisine Type -->
        <div class="filter-group">
          <label for="cuisineType">Cuisine Type:</label>
          <select id="cuisineType" v-model="cuisineType" @change="applyFilter">
            <option value="">All</option>
            <option value="Italian">Italian</option>
            <option value="French">French</option>
            <option value="Cafe">Cafe</option>
            <option value="Modern American">Modern American</option>
            <option value="Contemporary">Contemporary</option>
            <option value="Fast Food">Fast Food</option>
            <option value="Fusion">Fusion</option>
            <option value="Dessert">Dessert</option>
            <option value="Romantic">Romantic</option>
            <option value="Appetizers">Appetizers</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Bar & Grill">Bar & Grill</option>
            <option value="Brunch">Brunch</option>
            <option value="Casual Dining">Casual Dining</option>
            <option value="Diner">Diner</option>
            <option value="Seasonal">Seasonal</option>
            <option value="Family">Family</option>
          </select>
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
          <select id="couponType" v-model="couponType" @change="applyFilter">
            <option value="">All</option>
            <option value="percentage">Percentage</option>
            <option value="bogo">BOGO</option>
            <option value="free">Free</option>
          </select>
        </div>
        <!-- Filter by Foodie Group (dynamic) -->
        <div class="filter-group">
          <label for="foodieGroup">Foodie Group:</label>
          <select id="foodieGroup" v-model="foodieGroup" @change="applyFilter">
            <option value="">All</option>
            <option
              v-for="group in groups"
              :key="group.id"
              :value="group.id"
            >
              {{ group.name }}
            </option>
          </select>
        </div>
        <!-- Filter by Coupon Access -->
        <div class="filter-group">
          <label for="locked">Coupon Access:</label>
          <select id="locked" v-model="locked" @change="applyFilter">
            <option value="">All</option>
            <option value="locked">Locked Only</option>
            <option value="unlocked">Unlocked Only</option>
          </select>
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
      merchantFilter: "",
      activeOnly: false,
      couponType: "",
      cuisineType: "",
      foodieGroup: "",
      locked: "",
      isCollapsed: false,
      groups: []
    };
  },
  async mounted() {
    try {
      const resp = await fetch("http://localhost:3000/api/v1/groups");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      this.groups = await resp.json();
    } catch (err) {
      console.error("Could not load foodie groups:", err);
      // optionally: show user feedback
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },
    applyFilter() {
      // Emit current filter criteria upward
      this.$emit("filter-changed", {
        merchant: this.merchantFilter,
        activeOnly: this.activeOnly,
        couponType: this.couponType,
        cuisineType: this.cuisineType,
        foodieGroup: this.foodieGroup,
        locked: this.locked
      });
    }
  }
};
</script>

<style scoped>
.sidebar-filters {
  width: 250px;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  margin-bottom: 1rem;
}
.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-header h3 {
  margin: 0;
  font-size: 1.2rem;
}
.toggle-btn {
  background: none;
  border: none;
  font-size: 0.9rem;
  color: #007bff;
  cursor: pointer;
}
.filter-content {
  margin-top: 1rem;
}
.filter-group {
  margin-bottom: 0.75rem;
}
.filter-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.25rem;
}
.filter-group input[type="text"],
.filter-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
}
.collapse-enter,
.collapse-leave-to {
  opacity: 0;
  height: 0;
  overflow: hidden;
}
@media (max-width: 600px) {
  .sidebar-filters {
    width: 100%;
    margin-bottom: 1rem;
  }
}
</style>
