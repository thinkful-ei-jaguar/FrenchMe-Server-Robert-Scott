const express = require('express');
const xss = require('xss');
const LanguageService = require('./language-service');
const { requireAuth } = require('../middleware/jwt-auth');
const { LinkedList } = require('../linkedList');
const languageRouter = express.Router();
const bodyParser = express.json();

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
    const firstword = words[0]
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
      const {guess} = req.body;

      let xssGuess = xss(guess);
      const link = new LinkedList;
      //populate list
      const words = await LanguageService.PopulateLinkedlist(
        req.app.get('db'),
        req.language.id,
        link
      )
      const language = await LanguageService.getUsersLanguage(
        req.app.get('db'),
        req.user.id,
      )
      let response = {
          nextWord: words[1].original,
          wordCorrectCount: words[1].correct_count,
          wordIncorrectCount: words[1].incorrect_count,
          totalScore: language.total_score,
          answer: words[0].translation,
          isCorrect: true,  
      }

      //check if right or wrong
     if(xssGuess == link.head.value.translation){
        //multiply mem val by 2
        link.head.value.memory_value *= 2;
        //add 1 to the correct counter
        link.head.value.correct_count++;
        //add 1 to the total score counter
        language.total_score += 1;
        response = {...response,
          isCorrect: true,
        }
      } else {
        link.head.value.incorrect_count++;
        link.head.value.memory_value = 1;
        response = {...response,
          isCorrect: false,
        }
      }
        //push from list
        m = link.head.value.memory_value;
        temp = link.head;
        //while head && mem val is less than 0
        while(temp && m > 0){
          //first temp original 
          let toriginal = temp.value.original;
          let ttranslation = temp.value.translation;
          let tcorrect_count = temp.value.correct_count;
          let tincorrect_count = temp.value.incorrect_count;
          let tm = temp.value.memory_value;

          temp.value.original = temp.next.value.original;
          temp.value.translation = temp.next.value.translation;
          temp.value.correct_count = temp.next.value.correct_count;
          temp.value.incorrect_count = temp.next.value.incorrect_count;
          temp.value.memory_value = temp.next.value.memory_value;

          temp.next.value.original = toriginal;
          temp.next.value.translation = ttranslation;
          temp.next.value.correct_count = tcorrect_count;
          temp.next.value.incorrect_count = tincorrect_count;
          temp.next.value.memory_value = tm;
          temp = temp.next;
          m--;
        }
        //if we want an array
        arrtemp = link.head;
        linkarr = [];

        while(arrtemp){
          linkarr.push(arrtemp.value);
          arrtemp = arrtemp.next;
        }

        LanguageService.insertNewLinkedList(req.app.get('db'),linkarr);
        LanguageService.updateLanguagetotalScore(req.app.get('db'),language);

        return res.json(response),
        next();
    } catch (error) {
      next(error)
    }
  })

module.exports = languageRouter
