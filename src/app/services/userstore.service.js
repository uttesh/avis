

let usersStore = {};
let userIdList = [];

class UserStoreService {

   getStore(){
     return usersStore;
   }

   initStoreByUser(user){
    usersStore[user.id] = {
      user: user,
      totalCheck: 0,
      checkedCount: 0,
      missedCount: 0,
      tokenMessages: []
    }
   }

   getByKey(key){
    return usersStore[key];
   }

   put(key,value){
     usersStore[key] = value;
   }

   getUserIDsList(){
     return userIdList;
   }

   addTotalCheckForUser(userId){
    usersStore[userId].totalCheck = usersStore[userId].totalCheck + 1;
   }

   getTotalCheckByUser(userId){
     return usersStore[userId].totalCheck;
   }

   addToUserIdList(userId){
    userIdList.push(userId);
   }

   resetAll(){
    usersStore = {};
    userIdList = [];
   }

}

module.exports = UserStoreService