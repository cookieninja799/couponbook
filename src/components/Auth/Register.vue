<template>
  <div class="register">
    <h2>Register</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="fullName">Full Name:</label>
        <input id="fullName" type="text" v-model="fullName" required />
      </div>
      <div class="form-group">
        <label for="email">Email:</label>
        <input id="email" type="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input id="password" type="password" v-model="password" required />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm Password:</label>
        <input id="confirmPassword" type="password" v-model="confirmPassword" required />
      </div>
      <button type="submit">Register</button>
    </form>
  </div>
</template>

<script>
export default {
  name: "RegisterForm",
  data() {
    return {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: ""
    };
  },
  methods: {
    handleRegister() {
      // Simple validation to check if passwords match
      if (this.password !== this.confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
      // Placeholder for AWS Cognito registration logic
      console.log("Registering user:", this.fullName, this.email);
      alert("Registration functionality not implemented yet.");
    }
  }
};
</script>

<style scoped>
.register {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.form-group {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
}
input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  background-color: #28a745;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #218838;
}
</style>
