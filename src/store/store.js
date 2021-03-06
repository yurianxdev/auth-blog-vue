import Vue from "vue";
import Vuex from "vuex";
import router from "../router";

import axios from "../axios_auth";
import globalAxios from "axios";

Vue.use(Vuex);

function setLocalToken(tokenId, expiresIn, userId) {
  const now = new Date();
  const expirationDate = new Date(now.getTime() + expiresIn * 1000);
  localStorage.setItem("token", tokenId);
  localStorage.setItem("userId", userId);
  localStorage.setItem("expirationDate", expirationDate + "");
}

export default new Vuex.Store({
  state: {
    idToken: null,
    userId: null,
    user: null
  },
  mutations: {
    authUser(state, userData) {
      state.idToken = userData.token;
      state.userId = userData.userId;
    },
    storeUser(state, user) {
      state.user = user;
    },
    clearAuthData(state) {
      state.idToken = null;
      state.userId = null;
    }
  },
  actions: {
    setLogoutTimer({ dispatch }, expirationTime) {
      setTimeout(() => {
        dispatch("logOut");
      }, expirationTime * 1000);
    },
    async signUp({ commit, dispatch }, authData) {
      const response = await axios.post(
        ":signUp?key=AIzaSyBh7e65HnZbT04Ex9r2ikLm3VsniBnSwuk",
        {
          email: authData.email,
          password: authData.password,
          returnSecureToken: true
        }
      );

      commit("authUser", {
        token: response.data.idToken,
        userId: response.data.localId
      });
      dispatch("storeUser", authData);

      setLocalToken(
        response.data.idToken,
        response.data.expiresIn,
        response.data.localId
      );

      await router.push("/");
      dispatch("setLogoutTimer", response.data.expiresIn);
    },
    async logIn({ commit, dispatch }, authData) {
      const response = await axios.post(
        ":signInWithPassword?key=AIzaSyBh7e65HnZbT04Ex9r2ikLm3VsniBnSwuk",
        {
          email: authData.email,
          password: authData.password,
          returnSecureToken: true
        }
      );

      commit("authUser", {
        token: response.data.idToken,
        userId: response.data.localId
      });

      setLocalToken(
        response.data.idToken,
        response.data.expiresIn,
        response.data.localId
      );

      await router.push("/");
      dispatch("setLogoutTimer", response.data.expiresIn);
    },
    async tryAutoLogin({ commit }) {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const expirationDate = localStorage.getItem("expirationDate");
      const now = new Date();
      if (now >= expirationDate) {
        return;
      }

      const userId = localStorage.getItem("userId");

      commit("authUser", { token, userId });
      await router.push("/home");
    },
    async logOut({ commit }) {
      localStorage.removeItem("expirationDate");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");

      commit("clearAuthData");

      await router.push("/auth");
    },
    async storeUser({ state }, userData) {
      if (!state.idToken) {
        return;
      }

      const response = await globalAxios.post(
        `/users.json?auth=${state.idToken}`,
        userData
      );
      console.log(response);
    },
    async fetchUser({ commit, state }) {
      if (!state.idToken) {
        return;
      }

      const response = await globalAxios.get(
        `/users.json?auth=${state.idToken}`
      );
      const user = Object.values(response.data)[0];
      commit("storeUser", user);
    }
  },
  getters: {
    user(state) {
      return state.user;
    },
    isAuthenticated(state) {
      return state.idToken !== null;
    }
  }
});
