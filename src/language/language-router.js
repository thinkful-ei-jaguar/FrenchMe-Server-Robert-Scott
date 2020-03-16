const express = require('express');
const LanguageService = require('./language-service');
const { requireAuth } = require('../middleware/jwt-auth');
const {LinkedList} = require('../linkedList');
const languageRouter = express.Router();
const bodyParser=express.json();

languageRouter
  .use(requireAuth)
  .use(async (req, res, next) => {
    try {
      const language = await LanguageService.getUsersLanguage(
        req.app.get('db'),
        req.user.id,
      )

      if (!language)
        return res.status(404).json({
          error: `You don't have any languages`,
        })

      req.language = language
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .get('/', async (req, res, next) => {
    try {
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id,
      )

      res.json({
        language: req.language,
        words,
      })
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .get('/head', async (req, res, next) => {
    try {
    const words = await LanguageService.getLanguageWords(
      req.app.get('db'),
      req.language.id,
    )
    const firstword=words[0]
    res.json({
      firstword,
    })
    next()
  }catch (error) {
      next(error)
    }
  })

languageRouter
  .post('/guess',bodyParser, async (req, res, next) => {
    try {
      const {guess,id} = req.body;
      const link = new LinkedList;
      //populate list
      const words = await LanguageService.PopulateLinkedlist(
        req.app.get('db'),
        req.language.id,
        link
      )
      //console.log(link.head);
      //check if right or wrong
      if(guess == link.head.value.translation){
        console.log("they got their answer right")
        //multiply mem val by 2
        link.head.value.memory_value *= 2;
        //add 1 to the correct counter
        link.head.value.correct_count++;
        //add 1 to the total score counter

        //push from list
        //m = link.head.value.memory_value;
        m=2;
        temp = link.head;
        //while head && mem val is less than 0
        console.log(link.head);
        while(temp && m > 0){
          let toriginal =temp.value.original;
          let ttranslation=temp.value.translation;
          let tcorrect_count=temp.value.correct_count;
          let tincorrect_count=temp.value.incorrect_count;
          let tm  = temp.value.memory_value;
          temp.value.original=temp.next.value.original;
          temp.value.translation=temp.next.value.translation;
          temp.value.correct_count=temp.next.value.correct_count;
          temp.value.incorrect_count=temp.next.value.incorrect_count;
          temp.value.memory_value=temp.next.value.memory_value;
          temp.next.value.original=toriginal;
          temp.next.value.translation=ttranslation;
          temp.next.value.correct_count=tcorrect_count;
          temp.next.value.incorrect_count=tincorrect_count;
          temp.next.value.memory_value=tm;
          temp=temp.next;
          m--;
        }
        console.log(link.head);
      } else {

      }

      //console.log(guess);
      //console.log(id);

      
      //console.log(link);
      next()
    }catch (error) {
      next(error)
    }

  })

module.exports = languageRouter
