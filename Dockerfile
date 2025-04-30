FROM jekyll/jekyll:pages

COPY Gemfile* /srv/jekyll/

WORKDIR /srv/jekyll

RUN bundle config build.nokogiri --use-system-libraries && bundle install

EXPOSE 4000

CMD jekyll serve --watch --drafts
