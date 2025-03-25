<template>
  <div class="coupon-filter">
    <h3 @click="toggleCollapse" class="filter-header">
      Filter Coupons
      <span class="toggle-indicator">
        {{ collapsed ? "(Click to expand)" : "(Click to collapse)" }}
      </span>
    </h3>
    <transition name="collapse">
      <div v-if="!collapsed" class="filter-content">
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
        <div class="filter-group">
          <label for="title">Coupon Title:</label>
          <input
            id="title"
            type="text"
            v-model="titleFilter"
            @input="applyFilter"
            placeholder="Search by coupon title"
          />
        </div>
        <div class="filter-group">
          <label>
            <input type="checkbox" v-model="activeOnly" @change="applyFilter" />
            Show Active Coupons Only
          </label>
        </div>
        <div class="filter-group">
          <label for="couponType">Coupon Type:</label>
          <select id="couponType" v-model="couponType" @change="applyFilter">
            <option value="">All</option>
            <option value="percentage">Percentage</option>
            <option value="bogo">BOGO</option>
            <option value="free">Free</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="foodieGroup">Foodie Group:</label>
          <select id="foodieGroup" v-model="foodieGroup" @change="applyFilter">
            <option value="">All</option>
            <option value="charlotte">Charlotte</option>
            <option value="chapel hill">Chapel Hill</option>
            <option value="raleigh">Raleigh</option>
          </select>
        </div>
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
  </div>
</template>

<script>
export default {
  name: "CouponFilter",
  data() {
    return {
      merchantFilter: "",
      titleFilter: "",
      activeOnly: false,
      couponType: "",  // empty means "all"
      foodieGroup: "", // empty means "all groups"
      locked: "",      // empty means "all", "locked" or "unlocked"
      collapsed: false
    };
  },
  methods: {
    toggleCollapse() {
      this.collapsed = !this.collapsed;
    },
    applyFilter() {
      // Emit the current filter criteria to the parent component.
      this.$emit("filter-changed", {
        merchant: this.merchantFilter,
        title: this.titleFilter,
        activeOnly: this.activeOnly,
        couponType: this.couponType,
        foodieGroup: this.foodieGroup,
        locked: this.locked
      });
    }
  }
};
</script>

<style scoped>
.coupon-filter {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: left;
}
.filter-header {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.toggle-indicator {
  font-size: 0.9rem;
  font-style: italic;
  color: #555;
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

/* Transition for collapse/expand */
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
</style>
