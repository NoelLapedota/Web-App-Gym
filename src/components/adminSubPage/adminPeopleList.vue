<script setup>
import axios from 'axios';
import { ref, watchEffect, computed } from 'vue';
import Button from '../ui/Button.vue';
import ErrorMessage from '../ui/ErrorMessage.vue';
import utils from '../../JS/utils';

// PROPS
const props = defineProps({
    user: {
        type: Object,
        required: true
    }
});

//EMIT
const emit = defineEmits(['event']);

//VARIABLE
const search = ref('all');
const selectedOrder = ref('name');
const name = ref('');
const surname = ref('');
const username = ref('');
const edit = ref(false);
const formError = ref('');
const inputDisabled = ref(true);
const catEditUser = ref([]);
const catNewUser = ref([]);
let errorMessage = '';
const error = ref(false);
let oldUsername = '';
let old_category = '';
let userRole = '';

//COMPUTED
let filteredList = computed(() => {
    let filtered = [];
    let listCategory = [];
    const freeCategory = props.user.categories.filter(element => !props.user.categoryAthlete.includes(element));

    if (props.user.selected === 'trainer') {
        filtered.push(...props.user.trainers.sort(compare));
        listCategory.push(...props.user.categories)
    } else {
        filtered.push(...props.user.athletes.sort(compare));
        listCategory.push(...props.user.categoryAthlete)
    };

    if (search.value !== 'all') filtered = filtered.filter(el => el.category.some(cat => cat === search.value));

    if (search.value === 'without') filtered = props.user.withoutTrainer;


    return [filtered, listCategory, freeCategory]
});

//write username from name and surname and capitalize first letter
watchEffect(() => {
    username.value = `${utils.capitalizeFirstLetter(name.value.trim())}${utils.capitalizeFirstLetter(surname.value.trim())}`;
})

//function to sort the list of trainers/athletes by name or by monthly hours
function compare(a, b) {
    const first = selectedOrder.value === 'hours' ? Number(a.hours_minutes_of_training_mounth) : b.surname;
    const second = selectedOrder.value === 'hours' ? Number(b.hours_minutes_of_training_mounth) : a.surname;
    if (first < second) return 1;
    if (first > second) return -1;
    return 0;
};

//delete an athlete or trainer
const deleteItem = (element) => {
    axios
        .delete(`http://localhost:2000/api/v1/managementMyApp/edit/del/${element.username}`, { withCredentials: true, headers: { 'Access-Control-Allow-Credentials': 'true' } })
        .then((response) => {
            if (response.data.status === 201) {

                filteredList.value[0].forEach((el, index) => {
                    if (el.username === element.username) filteredList.value[0].splice(index, 1)
                });
                emit('event');
                const modal = document.querySelector('#modal' + element.username);
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();

            } else {
                errorMessage = `Unexpected error (${response.data.status}), user not deleted, try again!`;
                error.value = true;
            }
        })
}

//resets the form and variables for adding a new user
const resetForm = () => {
    const form = document.querySelector('#addNewForm');
    form.reset();
    catNewUser.value.length = 0;
    name.value = '';
    surname.value = '';
    username.value = '';
    error.value = false;
}

//enable the edit of a profile by clicking on the image
const editItem = (element) => {
    edit.value = true;
    inputDisabled.value = false;
    oldUsername = element.username;
    catEditUser.value.length = 0;
    if (element.category) catEditUser.value.push(...element.category);
    old_category = element.category;
    userRole = element.role;
}

//undo the profile form edit by resetting it
const cancel = (element) => {
    edit.value = false;
    formError.value = '';
    error.value = false;
    inputDisabled.value = true;
}

//save changes for editing a profile
const saveChange = (event) => {
    if (catEditUser.value.length === 0) {
        formError.value = 'Select at least one category.'
        return
    } else formError.value = '';
    const form = event.target;
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())
    data.category = [...catEditUser.value];
    data.old_category = old_category;
    data.role = userRole;
    axios
        .put(`http://localhost:2000/api/v1/managementMyApp/edit/${oldUsername}`, { ...data }, { withCredentials: true, headers: { 'Access-Control-Allow-Credentials': 'true' } })
        .then((response) => {
            if (response.data.status === 201) {
                emit('event');
                edit.value = false;
                formError.value = '';
                inputDisabled.value = true;
                error.value = false;

            }
            else {
                errorMessage = `Unexpected error (${response.data.status}), user not edited, try again!`;
                error.value = true;
            }
        })
}

//print the pdf of the current month
const printPdf = (element) => {
    const downloadFile = async () => {
        try {
            const response = await axios({
                url: 'http://localhost:2000/api/v1/download/',
                method: 'GET',
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'hours.pdf');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error(error);
        }
    };
    downloadFile()
}

console.log(filteredList[2])
//Add new user
const fetchNewUser = (event) => {
    if (catNewUser.value.length === 0) {
        formError.value = 'Select at least one category.'
        return
    }
    const form = event.target
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())
    data.category = [...catNewUser.value];
    data.password = data.username + '1000';
    data.confirmPassword = data.password;
    data.role = props.user.selected

    axios
        .post(`http://localhost:2000/api/v1/managementMyApp`, { ...data }, { withCredentials: true, headers: { 'Access-Control-Allow-Credentials': 'true' } })
        .then((response) => {
            console.log(response.data.status)
            if (response.data.status === 201) {
                emit('event');
                const modal = document.querySelector('#modalAddNew');
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();
                resetForm()
            }
            else {
                errorMessage = response.data.status === 402 ? 'The username oe email already exists' : `Unexpected error (${response.data.status}), try again!`;
                error.value = true;
        }
    })
}
</script>

<template>
    <h2 class="title">List of {{ user.selected }}</h2>

    <div class="butContainer col-6">
        <Button :type="{ color: 'warning', title: 'Add New' }" data-bs-toggle="modal" data-bs-target="#modalAddNew"
            @click="resetForm"></Button>

        <Button v-if="user.selected === 'trainer'" :type="{ color: 'danger', title: `All ${user.selected} PDF` }" @click="printPdf"></Button>
    </div>

    <div class="searchContainer col-6">
        <select v-model="search" @change="filtered" class="form-select search" aria-label="Default select example">
            <option value="all" selected>ALL COURSES</option>
            <option v-for="category in filteredList[1]" :key="category" :value="category">{{ category }}</option>
            <option v-if="user.selected === 'athlete'" value="without" selected>WITHOUT TRAINER</option>

        </select>
        <div v-if="user.selected === 'trainer'" class="order">
            <h5>Order By</h5>
            <div class="btn-group" role="group" aria-label="Basic radio toggle button group">
                <input type="radio" class="btn-check" v-model="selectedOrder" name="hours" id="btnradio1" value="hours"
                    autocomplete="off">
                <label class="btn btn-outline-primary" for="btnradio1">Hours</label>

                <input type="radio" class="btn-check" v-model="selectedOrder" name="name" id="btnradio2" value="name"
                    autocomplete="off" checked>
                <label class="btn btn-outline-primary" for="btnradio2">Name</label>
            </div>
        </div>

    </div>

    <div class="container">
        <div class="accordion accordion-flush" id="accordionFlushExample">

            <div v-for="trainer in filteredList[0]" :key="trainer.username" class="accordion-item">
                <h2 class="accordion-header" id="flush-headingOne">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                        :data-bs-target="'#' + trainer.username" aria-expanded="false"
                        :aria-controls="'#' + trainer.username">
                        {{ `${trainer.surname} ${trainer.name}` }} <span v-if="props.user.selected === 'trainer'">{{
                            utils.convertToTime(trainer.hours_minutes_of_training_mounth)
                        }}</span>
                    </button>
                </h2>

                <div :id="trainer.username" class="accordion-collapse collapse" aria-labelledby="flush-headingOne"
                    data-bs-parent="#accordionFlushExample">
                    <div class="accordion-body">

                        <ErrorMessage v-show="error" :message="errorMessage"></ErrorMessage>

                        <form class="needs-validation" id="editForm" @submit.prevent="saveChange">

                            <div class="mb-3 row">
                                <label for="username" class="col-sm-4 col-form-label">Username</label>
                                <div class="col-sm-8">
                                    <input type="text" class="form-control username" name="newUsername"
                                        :value="trainer.username" :disabled="inputDisabled">
                                </div>
                            </div>

                            <div class="mb-3 row">
                                <label for="name" class="col-sm-4 col-form-label">Name</label>
                                <div class="col-sm-8">
                                    <input type="text" class="form-control name" name="name" :value="trainer.name"
                                        :disabled="inputDisabled">
                                </div>
                            </div>

                            <div class="mb-3 row">
                                <label for="surname" class="col-sm-4 col-form-label">Surname</label>
                                <div class="col-sm-8">
                                    <input type="text" class="form-control surname" name="surname" :value="trainer.surname"
                                        :disabled="inputDisabled">
                                </div>
                            </div>

                            <div class="mb-3 row">
                                <label for="email" class="col-sm-4 col-form-label">Email address</label>
                                <div class="col-sm-8">
                                    <input type="email" class="form-control email" name="email" :value="trainer.email"
                                        :disabled="inputDisabled">
                                </div>
                            </div>

                            <!-- Default - if we are not in edit mode -->
                            <div v-if="!edit" class="editCat">
                                <div class="mb-3 row">
                                    <label for="category" class="col-sm-4 col-form-label">Courses</label>
                                    <div class="col-sm-8">
                                        <input type="text" class="form-control category"
                                            :value="trainer.category ? trainer.category.join(' - ') : ''"
                                            :disabled="inputDisabled">
                                    </div>
                                </div>
                                <div class="mb-3 row" v-if="props.user.selected === 'trainer'">
                                    <label for="mounthlyHours" class="col-sm-4 col-form-label">Mounthly Hours</label>
                                    <div class="col-sm-8">
                                        <p class="mounthlyHours" style="user-select: none; margin: 6px;">{{
                                            utils.convertToTime(trainer.hours_minutes_of_training_mounth) }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- if in EDIT mode I add the category checkboxes -->
                            <div v-else class="cateContainer">
                                <p v-show="formError" id="formError">{{ formError }}</p>
                                <div class="mb-3 row">
                                    <label for="catefories" class="col-sm-4 col-form-label">Courses</label>
                                    <div class="col-sm-8">
                                        <div v-for="category in filteredList[1]" :key="category"
                                            class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" v-model="catEditUser"
                                                role="switch" :id="category.replace(/\s/g, '')" :value="category">
                                            <label class="form-check-label" :for="category.replace(/\s/g, '')">{{ category
                                            }}</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!--  -->
                            <div v-if="edit" :id="'saveBtn' + trainer.username" class="save">
                                <Button :type="{ color: 'danger', title: 'Cancel' }" @click="cancel(trainer)"></Button>
                                <Button :type="{ color: 'success', title: 'Save', type: 'submit' }"></Button>
                            </div>

                            <!--  -->
                            <div v-else :id="'saveIcon' + trainer.username" class="buttonContainer">
                                <img src="@/components/icons/trash.png" alt="delete" data-bs-toggle="modal"
                                    :data-bs-target="'#modal' + trainer.username" @click="error = false">
                                <img src="@/components/icons/edit.png" alt="edit" @click="editItem(trainer)">
                                
                            </div>
                        </form>

                        <!-- Modal for Delete-->
                        <div class="modal fade" :id="'modal' + trainer.username" tabindex="-1"
                            aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <ErrorMessage v-show="error" :message="errorMessage"></ErrorMessage>
                                        <h1 class="modal-title fs-5" id="exampleModalLabel">Are you sure to delete it?</h1>
                                    </div>
                                    <div class="modal-footer">
                                        <Button :type="{ title: 'Close' }" data-bs-dismiss="modal"></Button>
                                        <Button :type="{ color: 'danger', title: 'Delete' }"
                                            @click="deleteItem(trainer)"></Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal for ADD NEW-->
    <div class="modal fade" id="modalAddNew" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <ErrorMessage v-show="props.user.selected === 'trainer' ? filteredList[2] : error" :message="props.user.selected === 'trainer' && filteredList[2].length === 0 ? 'There are no courses available, please add a course first' : errorMessage"></ErrorMessage>
                    <h1 class="modal-title fs-5" id="exampleModalLabel">Add new {{ user.selected }}</h1>
                </div>
                <div class="modal-body">

                    <form class="needs-validation" @submit.prevent="fetchNewUser" id="addNewForm">
                        <div class="mb-3 row">
                            <label for="name" class="col-sm-3 col-form-label">Name</label>
                            <div class="col-sm-9">
                                <input v-model="name" name="name" type="text" class="form-control name" required>
                            </div>
                        </div>
                        <div class="mb-3 row">
                            <label for="surname" class="col-sm-3 col-form-label">Surname</label>
                            <div class="col-sm-9">
                                <input v-model="surname" name="surname" type="text" class="form-control surname" required>
                            </div>
                        </div>
                        <div class="mb-3 row">
                            <label for="username" class="col-sm-3 col-form-label">Username</label>
                            <div class="col-sm-9">
                                <input v-model="username" name="username" type="text" class="form-control username"
                                    required>
                            </div>
                        </div>
                        <div class="mb-3 row">
                            <label for="email" class="col-sm-3 col-form-label">Email address</label>
                            <div class="col-sm-9">
                                <input name="email" type="email" class="form-control email" required>
                            </div>
                        </div>
                        <p v-if="formError" id="formError">{{ formError }}</p>
                        <div class="mb-3 row">
                            <label for="catefories" class="col-sm-3 col-form-label">Courses</label>
                            <div class="col-sm-9">
                                <div v-for="category in props.user.selected === 'trainer' ? filteredList[2] : filteredList[1]" :key="category" class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" v-model="catNewUser" role="switch"
                                        :id="category.replace(/\s/g, '')" :value="category">
                                    <label class="form-check-label" :for="category.replace(/\s/g, '')">{{ category
                                    }}</label>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <Button :type="{ color: 'danger', title: 'Cancel' }" data-bs-dismiss="modal"></Button>
                            <Button :type="{ color: 'success', title: 'Save', type: 'submit' }" v-if="props.user.selected === 'trainer' && filteredList[2].length === 0 ? false : true"></Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.title {
    text-transform: uppercase;
    margin-bottom: .5em;
}

.search {
    background-image: url('@/components/icons/search.png');
    background-repeat: no-repeat;
    background-size: 2.2em;
    text-align: center;
    text-transform: uppercase;
    box-shadow: 0 0 13px grey;
}

.searchContainer {
    display: flex;
    gap: 2em;
}

.butContainer {
    display: flex;
    gap: 2em;
    margin-bottom: 2em;

}

.order {
    display: flex;
    gap: .5em;
    align-items: center;
}

.order h5 {
    width: 4em;
    margin-top: 2px;
}

.order label {
    margin-bottom: 0;
}

.btn-group {
    box-shadow: 0 0 13px grey;
}

.container {
    margin: 1em;
    height: 100%;
    max-width: 50%;
    padding-bottom: 3em;
}

.buttonContainer {
    display: flex;
    justify-content: space-around;
}

.save {
    display: flex;
    gap: 2em;
}

.buttonContainer img {
    cursor: pointer;
    width: 4em;
}

/* accordion */

.accordion-item {
    margin-top: 0.5em;
    border-radius: 1.5em;
}

.accordion-button:not(.collapsed) {
    color: #000000;
}

.accordion-button span {
    position: absolute;
    right: 2.2em;
    border-radius: 50%;
    background-color: #557eb3;
    color: whitesmoke;
    font-weight: 700;
    padding: 4px;
    box-shadow: 0 0 4px darkblue;
}


.accordion-flush .accordion-item .accordion-button,
.accordion-flush .accordion-item .accordion-button.collapsed {
    border-radius: 1em;
    font-size: .7em;
}

/* Modal */

.modal-header {
    text-align: center;
    display: block;
    text-transform: uppercase;
}

.modal-title {
    margin: 0;
}

.modal-footer {
    flex-wrap: unset;
    gap: 3em;
}

#formError {
    color: red;
    text-align: center;
    margin: 0;
}

@media only screen and (max-width: 768px) {
    .container {
        max-width: 100%;
    }

    .search {
        width: 80%;
        font-size: .9em;
    }

    .searchContainer {
        width: 100%;
        gap: 1em;
        flex-direction: column;
        align-items: center;
    }

    .butContainer {
        width: 100%;
        padding: 0 1em;
    }

    .order {
        margin-bottom: .5em;
    }

    .searchContainer button {
        flex-basis: 8em;
        font-size: .9em !important;
    }

    #modalAddNew .col-form-label {
        padding-bottom: 0;
        padding-top: 0;
    }

    .accordion-flush .accordion-item .accordion-button,
    .accordion-flush .accordion-item .accordion-button.collapsed {
        font-size: .9em !important;
    }
}</style>