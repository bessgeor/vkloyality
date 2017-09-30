﻿import * as React from "react";
import * as ReactDOM from "react-dom";
import axios from "axios";

import './cardchecker.less';

function exists<T>(e: T): boolean
{
  return typeof e != 'undefined' && e != null;
}

interface ICardCheckerState
{
  IsChecking: boolean;
  IsSwindler: string;
  IsNotSwindler?: boolean;
  CardNumber: string;
  error?: any;
}

class CardChecker extends React.Component<{}, ICardCheckerState>
{
  state: ICardCheckerState; // a hack to allow state mutability which is prohibited by react typings

  getDefaultState: () => ICardCheckerState = () => ({ CardNumber: "", IsChecking: false, IsSwindler: null });

  constructor()
  {
    super();
    this.state = this.getDefaultState();
  }

  updateState: (e: React.ChangeEvent<HTMLInputElement>) => boolean = e =>
  {
    this.state.CardNumber = e.target.value.replace(/[\s-]/g, '');
    this.state.IsChecking = false;
    this.state.IsSwindler = null;
    this.state.IsNotSwindler = false;
    this.setState(this.state);
    return true;
  }

  checkIfSwindler: (e: React.MouseEvent<HTMLButtonElement>) => boolean = e =>
  {
    this.state.IsChecking = true;
    this.setState(this.state);

    axios.create().get('https://api.vk.com/method/board.getComments?group_id=104169151&topic_id=32651912&need_likes=0&offset=0&count=1&extended=0&v=5.68', { timeout: 2000 })
      .then(response => {
        console.log(response);
        interface IQuery {
          From: number;
          Count: number;
        }
        let queries : IQuery[] = [];
        for (let i = -1; true; i++)
        {
          let from = i >= 0 ? queries[i].From + queries[i].Count : 1;
          let to = (response.data.response.count as number) - from;
          if (to == NaN) throw new Error("Invalid response");
          to = to > 100 ? 100 : to;
          if (to <= 0)
            break;
          queries.push({ From: from, Count: to });
        }
        console.log(queries);
        
        Promise
          .all(queries.map(q => axios.create().get(`https://api.vk.com/method/board.getComments?group_id=104169151&topic_id=32651912&need_likes=0&offset=${q.From}&count=${q.Count}&extended=0&v=5.68`, { timeout: 2000 })))
          .then(response => {
            console.log(response);
            let invalid: boolean[] = response.map(r => r.data.response.items.push as boolean).filter(b => !b);
            console.log(invalid);
            if (invalid.length > 0)
              throw new Error("Invalid response");

            let comments: any[] = response.map(r => r.data.response.items).reduce((a, b) => a.concat(b));
            console.log(comments);
            let warning = comments
              .map(comment => ({Comment: comment, Index: comment.text.indexOf(this.state.CardNumber)}))
              .filter(candidate => candidate.Index >= 0)
              .filter(candidate => candidate.Index == 0 || candidate.Comment.text[candidate.Index - 1] == '\n')
              .filter(candidate => candidate.Comment.text.length == candidate.Index + this.state.CardNumber.length
                || candidate.Comment.text[candidate.Index + this.state.CardNumber.length] == '\n')
              .map(candidate => candidate.Comment);
            console.log(warning);
            if (warning.length > 0)
              this.state.IsSwindler = `https://vk.com/topic-104169151_32651912?post=${warning[0].id}`;
            else
              this.state.IsNotSwindler = true;
            this.state.IsChecking = false;
            this.setState(this.state);
          })
          .catch(e => {
            console.log(e);
            this.state.error = e;
            this.setState(this.state);
          });
      })
      .catch(e => {
        console.log(e);
        this.state.error = e;
        this.setState(this.state);
      } ); 
    return true;
  }

  resetState: () => void = () =>
  {
    this.state = this.getDefaultState();
    this.setState(this.state);
  }

  render() {
    return this.state.error
      ? <div>
          <p className="error">{this.state.error.message} happens. Please contact the <a href="https://vk.com/b.geor">author</a></p>
          <button onClick={this.resetState}>Try Again</button>
        </div>
      : <div>
        <input onChange={this.updateState} placeholder="enter payment props to check here" value={this.state.CardNumber} readOnly={this.state.IsChecking} />
        {this.state.IsSwindler != null
          ? <div>
            <h3 className="swindler">Warning: swindler found</h3>
            <a href={this.state.IsSwindler} target="_blank">Learn more...</a>
          </div>
          : this.state.IsNotSwindler === true
            ? <h3 className="notSwindler">No swindler activity found</h3>
            : this.state.IsChecking
              ? <p> throbber here</p>
              : <button onClick={this.checkIfSwindler} role="button">Check</button>}
    </div>
  }
}

ReactDOM.render(<CardChecker />, document.getElementsByTagName( 'div' )[ 0 ]);