'use strict';
const {
  PENDING, COMMENTED, APPROVED, CHANGES_REQUESTED, DISMISSED
} = require('./review_state');
const { isCollaborator } = require('./collaborators');
const { ascending } = require('./comp');
const LGTM_RE = /(\W|^)lgtm(\W|$)/i;
const FROM_REVIEW = 'review';
const FROM_COMMENT = 'comment';

class Review {
  /**
   * @param {string} state
   * @param {string} date  // ISO date string
   * @param {string} ref
   * @param {string} source
   */
  constructor(state, date, ref, source) {
    this.state = state;
    this.date = date;
    this.ref = ref;
    this.source = source;
  }
}

/**
  * @typedef  {Object} GHReview
  * @property {string} bodyText
  * @property {string} state
  * @property {{login: string}} author
  * @property {string} url
  * @property {string} publishedAt
  *
  * @typedef  {Object} GHComment
  * @property {string} bodyText
  * @property {{login: string}} author
  * @property {string} publishedAt
 */
class ReviewAnalyzer {
  /**
   * @param {GHReview[]} reviews
   * @param {GHComment[]} comments
   * @param {Map<string, Collaborator>} collaborators
   */
  constructor(reviews, comments, collaborators) {
    this.reviews = reviews;
    this.comments = comments;
    this.collaborators = collaborators;
  }

  /**
   * @returns {Map<string, Review>}
   */
  mapByGithubReviews() {
    const map = new Map();
    const collaborators = this.collaborators;
    const list = this.reviews
      .filter((r) => r.state !== PENDING && r.state !== COMMENTED)
      .filter((r) => {
        return (isCollaborator(collaborators, r.author));
      }).sort((a, b) => {
        return ascending(a.publishedAt, b.publishedAt);
      });

    for (const r of list) {
      const login = r.author.login.toLowerCase();
      const entry = map.get(login);
      if (!entry) {  // initialize
        map.set(
          login,
          new Review(r.state, r.publishedAt, r.url, FROM_REVIEW)
        );
      }
      switch (r.state) {
        case APPROVED:
        case CHANGES_REQUESTED:
          // Overwrite previous reviews, whether initalized or not
          map.set(
            login,
            new Review(r.state, r.publishedAt, r.url, FROM_REVIEW)
          );
          break;
        case DISMISSED:
          // TODO: check the state of the dismissed review?
          map.delete(login);
          break;
      }
    }
    return map;
  }

  // TODO: count -1 ...? But they should just make it explicit
  /**
   * @param {Map<string, Review>} oldMap
   * @returns {Map<string, Review>}
   */
  updateMapByRawReviews(oldMap) {
    const comments = this.comments;
    const collaborators = this.collaborators;
    const withLgtm = comments.filter((c) => LGTM_RE.test(c.bodyText))
      .filter((c) => {
        return (isCollaborator(collaborators, c.author));
      }).sort((a, b) => {
        return ascending(a.publishedAt, b.publishedAt);
      });

    for (const c of withLgtm) {
      const login = c.author.login.toLowerCase();
      const entry = oldMap.get(login);
      if (!entry || entry.date < c.publishedAt) {
        oldMap.set(
          login,
          // no url, have to use bodyText for refs
          new Review(APPROVED, c.publishedAt, c.bodyText, FROM_COMMENT)
        );
      }
    }
    return oldMap;
  }

  /**
   * @typedef {{reviwewer: Collaborator, review: Review}[]} ReviewerList
   * @returns {{approved: ReviewerList, rejected: ReviewerList}}
   */
  getReviewers() {
    const ghReviews = this.mapByGithubReviews();
    const reviewers = this.updateMapByRawReviews(ghReviews);
    const result = {
      approved: [],
      rejected: []
    };
    const collaborators = this.collaborators;
    for (const [ login, review ] of reviewers) {
      const reviewer = collaborators.get(login.toLowerCase());
      if (review.state === APPROVED) {
        result.approved.push({ reviewer, review });
      } else if (review.state === CHANGES_REQUESTED) {
        result.rejected.push({ reviewer, review });
      }
    }
    return result;
  }
}

const REVIEW_SOURCES = {
  FROM_COMMENT, FROM_REVIEW
};

module.exports = {
  ReviewAnalyzer,
  Review,
  REVIEW_SOURCES
};