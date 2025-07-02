<template>
  <div class="foodie-group-list">
    <h1>Available Foodie Groups</h1>

    <!-- Loading / Error States -->
    <p v-if="loading">Loading groups…</p>
    <p v-else-if="error" class="error">⚠️ {{ error }}</p>

    <!-- Groups Grid -->
    <div v-else class="group-list-container">
      <div 
        v-for="group in groups" 
        :key="group.id" 
        class="group-card"
      >
        <div class="card-content">
          <h2>{{ group.name }}</h2>
          <p>{{ group.description }}</p>
          <p class="location" v-if="group.location">
            Location: {{ group.location }}
          </p>
        </div>
        <router-link 
          :to="{ name: 'FoodieGroupView', params: { id: group.id } }" 
          class="btn"
        >
          View Group
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FoodieGroupList",
  data() {
    return {
      groups: [],       // ← will hold API data
      loading: true,
      error: null
    };
  },
  async mounted() {
    try {
      const res = await fetch('http://localhost:3000/api/v1/groups');
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      this.groups = await res.json();
    } catch (err) {
      console.error("Failed to load groups", err);
      this.error = "Could not load groups. " + err.message;
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.foodie-group-list {
  padding: 2rem;
  text-align: center;
}
.group-list-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}
.group-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  width: 300px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 350px;
}
.card-content {
  margin-bottom: 1rem;
}
.location {
  font-style: italic;
  color: #555;
  margin-bottom: 1rem;
}
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}
.btn:hover {
  background-color: #0056b3;
}
.error {
  color: red;
  margin-top: 1rem;
}
</style>
