<script setup>
import { ref } from 'vue';
import getData from '../JS/getData.js';
import personalProfile from './personalProfile.vue';
import adminPeopleList from './adminSubPage/adminPeopleList.vue';
import adminCategories from './adminSubPage/adminCategories.vue';
import Calendar from './calendar.vue';
import Button from './ui/Button.vue';
import DbError from './ui/DbError.vue';

//PROPS
const props = defineProps({
    userInfo: {
        type: Object,
        required: true
    }
});

//EMIT
const emit = defineEmits(['logout']);

//VARIABLES
const selected = ref('');
const showBack = ref(false);
const data = ref([]);

//get all data from db
function get() {
    getData.getData().then((res) => { data.value = res; if (res.status) selected.value = 'dbError' })
}

get()

</script>

<template>
    <img v-show="showBack" class="back" src="@/components/icons/back.png" alt="back"
        @click="[selected, showBack] = ['', false]">

    <div v-if="selected === ''" class="d-grid gap-4 col-4 mx-auto butContainer">
        <Button :type="{ icons: 'adminProfile', title: `${userInfo.name.toLocaleUpperCase()} 's Profile` }"
            @click="[selected, showBack] = ['profile', true]"></Button>
        <hr>

        <Button :type="{ icons: 'trainer', title: 'Trainers' }" @click="[selected, showBack] = ['trainer', true]"></Button>

        <Button :type="{ icons: 'athlete', title: 'Athletes' }" @click="[selected, showBack] = ['athlete', true]"></Button>

        <Button :type="{ icons: 'category', title: 'Courses' }"
            @click="[selected, showBack] = ['category', true]"></Button>

        <Button :type="{ icons: 'calendar', title: 'Calendar' }"
            @click="[selected, showBack] = ['calendar', true]"></Button>

    </div>

    <DbError v-if="selected === 'dbError'"></DbError>

    <personalProfile v-if="selected === 'profile'" @profile-logout="emit('logout')" :userInfo="userInfo" @update-profile="get"/>

    <adminPeopleList v-if="selected === 'trainer' || selected === 'athlete'" :user="{ selected, ...data }" @event="get" />

    <adminCategories v-if="selected === 'category'" :category="data.categories" @cat-changed="get" />

    <Calendar v-if="selected === 'calendar'" :category="data.categories"  :type="'admin'" :calendar="data.calendar" @edit="get"/>
</template>

<style scoped>
.back {
    width: 3em;
    cursor: pointer;
    transform: translate(15em);
}

@media only screen and (max-width: 768px) {

    h1 {
        font-size: 1.5em !important;
    }

    .butContainer {
        width: 90%;
    }

    .back {
        align-self: flex-end;
        transform: none;
    }
}
</style>