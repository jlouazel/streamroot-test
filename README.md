# Streamroot Test
### Features
- Accounts creation
- Connection throught social networks (for privacy purposes, the Facebook connection must be reviewed ~2 weeks)
- Chat rooms from 2 to 5 people
- Search in connected users
- Ban people
- Chat enhancement (copy/paste links, copy/paste image links, embedded youtube videos)


### How to use the app?
- First connect to your account / create a new account
- On the main page, you'll see your connected friends, click on one of them on the right list
- To add a user in your stream, click the '+' symbol near the text input and then click on a user
- To ban someone, click on the 'x' in a user bagdge above the text input

### Known isssues
- When you speak to a user, if he disconnect and reconnect and you send him a message after, an Angular error will be thrown because the stream will duplicate
- Sometime you don't receive the event that another user is connected so you can't speak with him
