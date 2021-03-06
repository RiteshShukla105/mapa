import React from "react";
import { translate } from "react-i18next";
import styled from "styled-components";
import i18n from "../../i18n"

const APIPage = props => {
  const apiText = `openapi: 3.0.3
  info:
    title: OpenFairDB API
    version: 0.8.20
    contact:
      name: slowtec GmbH
      url: 'https://slowtec.de'
    license:
      name: AGPLv3
      url: 'https://github.com/slowtec/openfairdb/blob/master/LICENSE'
  servers:
    - url: 'https://api.ofdb.io/v0/'
      description: Public production server
    - url: 'https://dev.ofdb.io/v0/'
      description: Public unstable development server
  paths:
    /search:
      get:
        summary: Search for entries
        description: |
          Search results are ordered by total rating.
  
          The default result contains up to 100 entries. Use the 'limit' parameter
          to customize the desired amount. The server may decide to deliver less
          results than requested up to some internal upper limit (currently 500).
  
          If no particular review status are requested only visible places
          (created, confirmed) are returned.
        tags:
          - Search
        parameters:
          - $ref: '#/components/parameters/BoundingBox'
          - name: categories
            in: query
            schema:
              type: string
            description: |
              Comma-separated list of category identifiers.
              We currently use the following two:
              - Initiative (non-commercial): '2cd00bebec0c48ba9db761da48678134'
              - Company (commercial): '77b3c33a92554bcf8e8c2c86cedd6f6f'
          - name: text
            in: query
            schema:
              type: string
          - $ref: '#/components/parameters/IdList'
          - $ref: '#/components/parameters/TagList'
          - $ref: '#/components/parameters/ReviewStatusList'
          - $ref: '#/components/parameters/PaginationLimit'
        responses:
          '200':
            description: Successful response
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/SearchResponse'
    /entries:
      post:
        summary: Create an entry
        tags:
          - Entries
        requestBody:
          required: true
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NewEntry'
        responses:
          '200':
            description: Successful response
    '/entries/{ids}':
      get:
        summary: Get multiple entries
        tags:
          - Entries
        parameters:
          - $ref: '#/components/parameters/IdListPath'
        responses:
          '200':
            description: Successful response
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/Entry'
    '/entries/{id}':
      put:
        summary: Update an entry
        description: |
          The edited entry must include the *next version* of this entry
          in the 'version' field, where *next version* = *current version* + 1.
        tags:
          - Entries
        parameters:
          - $ref: '#/components/parameters/IdPath'
        requestBody:
          required: true
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntryWithVersion'
        responses:
          '200':
            description: Successful response
    /entries/recently-changed:
      get:
        summary: Get recently changed entries
        description: |
          Get recently changed entries that have been created/updated/archived between since and now.
          Limitation: Only the most recent 1000 entries are returned and the change history is
          restricted to the last 100 days.
        tags:
          - Entries
        parameters:
          - name: since
            in: query
            required: false
            description: Time stamp of the oldest change (inclusive)
            schema:
              $ref: '#/components/schemas/UnixTime'
          - name: until
            in: query
            required: false
            description: Time stamp of the most recent change (exclusive)
            schema:
              $ref: '#/components/schemas/UnixTime'
          - name: with_ratings
            in: query
            description: Return entries including their ratings
            schema:
              type: boolean
          - $ref: '#/components/parameters/PaginationLimit'
          - $ref: '#/components/parameters/PaginationOffset'
        responses:
          '200':
            description: Successful response
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/Entry'
    /entries/most-popular-tags:
      get:
        summary: Get most popular tags for entries
        description: |
          Get most popular tags for entries with their total usage count.
          Results are sorted in descending order of counts, i.e. most popular
          tags appear first. A maximum of 1000 tag with their count is returned
          if no limit is specifid.
        tags:
          - Entries
        parameters:
          - name: min_count
            in: query
            required: false
            description: Minimum count per tag (inclusive)
            schema:
              type: integer
              format: int64
          - name: max_count
            in: query
            required: false
            description: Maximum count per tag (inclusive)
            schema:
              type: integer
              format: int64
          - $ref: '#/components/parameters/PaginationLimit'
          - $ref: '#/components/parameters/PaginationOffset'
        responses:
          '200':
            description: Successful response
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/TagCounts'
    '/places/{id}/history':
      get:
        tags:
          - Places
        summary: History of place revisions
        description: |
          Loads the history of all history of place revisions including all reviews.
          Sorted in descending order of activity time stamps, i.e. the most recent
          changes appear first.
          Only scouts and admins are entitled to invoke this function.
        parameters:
          - $ref: '#/components/parameters/IdPath'
        responses:
          '200':
            description: Successful response
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/PlaceHistory'
          '401':
            $ref: '#/components/responses/UnauthorizedError'
    '/places/{ids}/review':
      post:
        tags:
          - Places
        summary: Review multiple places
        description: |
          Reviews the latest revision of multiple places at once. An audit log
          is written into the history of all place revisions.
          Dependening on the review status the affected places might be
          hidden from search results (archived, rejected) or re-appear
          (created, confirmed).
          Only scouts and admins are entitled to invoke this function.
        parameters:
          - $ref: '#/components/parameters/IdListPath'
        requestBody:
          required: true
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Review'
        responses:
          '201':
            description: Created a review for all places.
          '400':
            $ref: '#/components/responses/ParameterError'
          '401':
            $ref: '#/components/responses/UnauthorizedError'
    '/ratings/{ids}':
      get:
        summary: Get multiple ratings
        tags:
          - Ratings
        parameters:
          - $ref: '#/components/parameters/IdListPath'
        responses:
          '200':
            description: Successful response
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/Rating'
    /categories/:
      get:
        summary: Get available categories
        tags:
          - Categories
        responses:
          '200':
            description: Successful response
            content:
              application/json:
                schema:
                  type: array
                  items:
                    $ref: '#/components/schemas/Category'
    '/categories/{ids}':
      get:
        summary: Get multiple categories
        tags:
          - Categories
        parameters:
          - $ref: '#/components/parameters/IdListPath'
        responses:
          '200':
            description: Successful response
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/Category'
    /events:
      get:
        tags:
          - Events
        summary: Search events
        parameters:
          - $ref: '#/components/parameters/BoundingBox'
          - $ref: '#/components/parameters/PaginationLimit'
          - $ref: '#/components/parameters/EventTagList'
          - $ref: '#/components/parameters/EventStartMin'
          - $ref: '#/components/parameters/EventStartMax'
          - $ref: '#/components/parameters/EventFilterText'
          - $ref: '#/components/parameters/EventCreatedBy'
        responses:
          '200':
            description: Successful response
            content:
              application/json:
                schema:
                  type: array
                  items:
                    $ref: '#/components/schemas/Event'
      post:
        tags:
          - Events
        summary: Create a new event
        description: |
          Creating new events is only allowed for registered organizations
          by authorizing themselves with an API token. These organizations must
          own reserved tags.
  
          One or more reserved tags have to be provided upon creation. Otherwise
          all of the organization's reserved tags are added implicitly to the event.
        security:
          - bearerAuth: []
        requestBody:
          required: true
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Event'
        responses:
          '201':
            description: Created a new event
            content:
              application/json:
                schema:
                  description: The ID of the created event
                  type: string
          '401':
            $ref: '#/components/responses/UnauthorizedError'
    '/events/{id}':
      get:
        summary: Get a single event
        tags:
          - Events
        parameters:
          - name: id
            in: path
            required: true
            schema:
              type: string
        responses:
          '200':
            description: Successful response
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/Event'
      put:
        summary: Update an event
        description: |
          Events can only be updated by the organization that owns them.
          Ownership is determined by the event's reserved tags.
  
          The updated event must be assigned at least one of the organization's
          reserved tags. Otherwise all reserved tags of the event are preserved
          by implicitly re-adding them.
        tags:
          - Events
        security:
          - bearerAuth: []
        parameters:
          - name: id
            in: path
            required: true
            schema:
              type: string
        requestBody:
          required: true
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Event'
        responses:
          '200':
            description: Sucessfully updated the event
          '401':
            $ref: '#/components/responses/UnauthorizedError'
      delete:
        summary: Delete an event
        description: |
          Events can only be deleted by the organization that owns them.
          Ownership is determined by the event's reserved tags.
        tags:
          - Events
        security:
          - bearerAuth: []
        parameters:
          - name: id
            in: path
            required: true
            schema:
              type: string
        responses:
          '200':
            description: Sucessfully deleted the event
          '401':
            $ref: '#/components/responses/UnauthorizedError'
    '/events/{ids}/archive':
      post:
        tags:
          - Events
        summary: Archive multiple events
        description: |
          Marks the given events as *archived* and excludes them from
          all search results.
  
          Only scouts and admins are entitled to invoke this function.
        parameters:
          - $ref: '#/components/parameters/IdListPath'
        responses:
          '204':
            description: Archived the given events if not already archived.
          '400':
            $ref: '#/components/responses/ParameterError'
          '401':
            $ref: '#/components/responses/UnauthorizedError'
    /login:
      post:
        summary: User login
        tags:
          - Users
        requestBody:
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  email:
                    $ref: '#/components/schemas/Email'
                  password:
                    type: string
        responses:
          '200':
            description: Sucessful response
    /logout:
      post:
        summary: User logout
        tags:
          - Users
        responses:
          '200':
            description: Sucessful response
    /users/current:
      get:
        summary: Get the current user
        tags:
          - Users
        responses:
          '200':
            description: The current user
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/User'
    /users/reset-password-request:
      post:
        summary: Request a password reset
        tags:
          - Users
        requestBody:
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  email:
                    $ref: '#/components/schemas/Email'
        responses:
          '200':
            description: Sucessful response
    /users/reset-password:
      post:
        summary: Request a users password
        tags:
          - Users
        requestBody:
          required: true
          content:
            application/json:
              schema:
                type: object
                properties:
                  email:
                    $ref: '#/components/schemas/Email'
                  token:
                    type: string
                  new_password:
                    type: string
        responses:
          '200':
            description: Sucessful response
    /'subscribe-to-bbox':
      post:
        summary: Subscribe to a bounding box
        tags:
          - Subscriptions
        requestBody:
          required: true
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/LatLonDeg'
              example:
                - lat: 45.3
                  lng: 8.6
                - lat: 48.7
                  lng: 9.2
        responses:
          '200':
            description: Sucessful response
    /'bbox-subscriptions':
      get:
        summary: Fetch subscriptions
        tags:
          - Subscriptions
        responses:
          '200':
            description: Sucessful response
            content:
              application/json:
                schema:
                  type: array
                  items:
                    $ref: '#/components/schemas/BboxSubscription'
    /'unsubscribe-all-bboxes':
      delete:
        summary: Delete all subscriptions
        tags:
          - Subscriptions
        responses:
          '200':
            description: Sucessful response
    /tags:
      get:
        summary: Get tags
        tags:
          - Tags
        responses:
          '200':
            description: Sucessful response
            content:
              application/json:
                schema:
                  type: array
                  items:
                    type: string
    /count/entries:
      get:
        summary: Get number of entries
        tags:
          - Stats
        responses:
          '200':
            description: Sucessful response
            content:
              application/json:
                schema:
                  type: integer
    /count/tags:
      get:
        summary: Get number of tags
        tags:
          - Stats
        responses:
          '200':
            description: Successful response
            content:
              application/json:
                schema:
                  type: integer
    /server/version:
      get:
        summary: Get current server version
        tags:
          - Stats
        responses:
          '200':
            description: Successful response
            content:
              text/plain:
                schema:
                  type: string
    /server/openapi.yaml:
      get:
        summary: Download the current API documentation
        tags:
          - Stats
        responses:
          '200':
            description: Successful response
            content:
              text/yaml:
                schema:
                  type: string
    /export/entries.csv:
      get:
        summary: Export places as CSV.
        description: |
          The CSV export is only available for logged in users with the role _Admin_ or _Scout_.
  
          This request supports the same paramaters as the corresponding search request.
  
          Contact details (email/phone) are only visible for users with the role _Admin_ or _Scout_.
  
          Information about who created the current version (created_by) is only visible for
          users with the role _Admin_ or owners of this entry.
  
          **Example**:
  
          Export all entries in Germany:
          '/export/entries.csv?bbox=47.49,0.79,54.63,18.30'
        tags:
          - Export
        parameters:
          - $ref: '#/components/parameters/BoundingBox'
          - name: categories
            in: query
            schema:
              type: string
            description: |
              Comma-separated list of category identifiers.
              We currently use the following two:
              - Initiative (non-commercial): '2cd00bebec0c48ba9db761da48678134'
              - Company (commercial): '77b3c33a92554bcf8e8c2c86cedd6f6f'
          - name: text
            in: query
            schema:
              type: string
          - $ref: '#/components/parameters/IdList'
          - $ref: '#/components/parameters/TagList'
          - $ref: '#/components/parameters/ReviewStatusList'
          - $ref: '#/components/parameters/PaginationLimit'
        responses:
          '200':
            description: Successful response
            content:
              text/csv:
                schema:
                  type: string
          '401':
            $ref: '#/components/responses/UnauthorizedError'
    /export/events.csv:
      get:
        summary: Export events as CSV.
        description: |
          The CSV export is only available for logged in users with the role _Admin_ or _Scout_.
  
          This request supports the same paramaters as the corresponding search request.
  
          **Example**:
  
          Export all events in Germany:
          '/export/events.csv?bbox=47.49,0.79,54.63,18.30'
        tags:
          - Export
        parameters:
          - $ref: '#/components/parameters/BoundingBox'
          - $ref: '#/components/parameters/PaginationLimit'
          - $ref: '#/components/parameters/EventTagList'
          - $ref: '#/components/parameters/EventStartMin'
          - $ref: '#/components/parameters/EventStartMax'
          - $ref: '#/components/parameters/EventFilterText'
          - $ref: '#/components/parameters/EventCreatedBy'
        responses:
          '200':
            description: Successful response
            content:
              text/csv:
                schema:
                  type: string
          '401':
            $ref: '#/components/responses/UnauthorizedError'
  components:
    schemas:
      NewEntry:
        properties:
          title:
            type: string
          description:
            type: string
          lat:
            $ref: '#/components/schemas/Latitude'
          lng:
            $ref: '#/components/schemas/Longitude'
          street:
            type: string
          zip:
            type: string
          city:
            type: string
          country:
            type: string
          state:
            type: string
          email:
            $ref: '#/components/schemas/Email'
          telephone:
            $ref: '#/components/schemas/Phone'
          homepage:
            $ref: '#/components/schemas/Url'
          opening_hours:
            $ref: '#/components/schemas/OpeningHours'
          categories:
            type: array
            items:
              type: string
          tags:
            $ref: '#/components/schemas/TagArray'
          image_url:
            $ref: '#/components/schemas/Url'
          image_link_url:
            $ref: '#/components/schemas/Url'
          license:
            $ref: '#/components/schemas/License'
      EntryWithVersion:
        allOf:
          - $ref: '#/components/schemas/NewEntry'
          - type: object
            properties:
              version:
                type: integer
      Entry:
        allOf:
          - $ref: '#/components/schemas/EntryWithVersion'
          - type: object
            properties:
              id:
                $ref: '#/components/schemas/Id'
              created:
                type: integer
              ratings:
                type: array
                items:
                  type: string
      Category:
        properties:
          id:
            $ref: '#/components/schemas/Id'
          created:
            type: integer
          version:
            type: integer
          name:
            type: string
      Rating:
        properties:
          id:
            $ref: '#/components/schemas/Id'
          title:
            type: string
          created:
            type: integer
          value:
            type: integer
          context:
            type: string
          source:
            type: string
          comments:
            type: array
            items:
              $ref: '#/components/schemas/RatingComment'
      RatingComment:
        properties:
          id:
            $ref: '#/components/schemas/Id'
          created:
            $ref: '#/components/schemas/UnixTimeMillis'
          text:
            type: string
      BboxSubscription:
        properties:
          id:
            $ref: '#/components/schemas/Id'
          south_west_lat:
            $ref: '#/components/schemas/Latitude'
          south_west_lng:
            $ref: '#/components/schemas/Longitude'
          north_east_lat:
            $ref: '#/components/schemas/Latitude'
          north_east_lng:
            $ref: '#/components/schemas/Longitude'
      SearchResponse:
        properties:
          visible:
            description: 'The entries that are in the given bounding box (bbox, area of the map).'
            type: array
            items:
              $ref: '#/components/schemas/SearchEntry'
          invisible:
            description: Up to 5 entries outside the bbox.
            type: array
            items:
              $ref: '#/components/schemas/SearchEntry'
      SearchEntry:
        description: The compact view of an entry as returned in search results.
        properties:
          id:
            $ref: '#/components/schemas/Id'
          status:
            $ref: '#/components/schemas/ReviewStatus'
          lat:
            $ref: '#/components/schemas/Latitude'
          lng:
            $ref: '#/components/schemas/Longitude'
          title:
            type: string
          description:
            type: string
          categories:
            type: array
            items:
              type: string
          tags:
            $ref: '#/components/schemas/TagArray'
          ratings:
            $ref: '#/components/schemas/AvgRatings'
      AvgRatings:
        description: All average ratings of an entry.
        properties:
          total:
            type: number
          diversity:
            type: number
          fairness:
            type: number
          humanity:
            type: number
          renewable:
            type: number
          solidarity:
            type: number
          transparency:
            type: number
      Id:
        type: string
        minLength: 32
        maxLength: 32
        description: |
          Identifier of a resource
        example: 7cee99c287094a94acbdcf29ffff2e85
      IdArray:
        type: array
        items:
          $ref: '#/components/schemas/Id'
      Revision:
        type: integer
        format: i64
        minimum: 0
        description: |
          A revision number
        example: 23
      IdList:
        type: string
        description: |
          Comma-separated list of identifiers
        example: '7cee99c287094a94acbdcf29ffff2e85,0884c4e86e404072b6874b99b7e32640,ed8a2aef20054102b20950b1b78eb581'
      TagList:
        type: string
        description: |
          Comma-separated list of tags
        example: 'organic,non-profit'
      License:
        type: string
        minLength: 1
        example: CC0-1.0
      Email:
        type: string
        minLength: 3
        description: |
          An e-mail address of a user
        example: user@example.com
      Title:
        type: string
        minLength: 1
        example: A non-empty title
      Description:
        type: string
        minLength: 1
        example: A non-empty description
      Street:
        type: string
        example: Friedrichsberg 55
      City:
        type: string
        example: Stuttgart
      ZipCode:
        type: string
        example: 70567
      Country:
        type: string
        example: Germany
      State:
        type: string
        example: Baden-Württemberg
      Phone:
        type: string
        example: 001 123456789
      Tag:
        type: string
        minLength: 1
        example: non-profit
      TagArray:
        type: array
        items:
          $ref: '#/components/schemas/Tag'
        example:
          - organic
          - non-profit
      Url:
        type: string
        minLength: 8
        example: 'https://www.slowtec.de/'
      Activity:
        properties:
          at:
            $ref: '#/components/schemas/UnixTimeMillis'
          by:
            $ref: '#/components/schemas/Email'
        required:
          - at
      ActivityContext:
        type: string
        description: |
          Implicitly recorded context of an activity
      ActivityComment:
        type: string
        description: |
          Free text that describes the motivation or trigger for an activity
        example: 'Action performed, because ...'
      ActivityLog:
        properties:
          at:
            $ref: '#/components/schemas/UnixTimeMillis'
          by:
            $ref: '#/components/schemas/Email'
          ctx:
            $ref: '#/components/schemas/ActivityContext'
          comment:
            $ref: '#/components/schemas/ActivityComment'
        required:
          - at
      Location:
        properties:
          deg:
            $ref: '#/components/schemas/LatLonDeg'
          adr:
            $ref: '#/components/schemas/Address'
        required:
          - deg
      Contact:
        properties:
          phone:
            $ref: '#/components/schemas/Phone'
          email:
            $ref: '#/components/schemas/Email'
      Address:
        properties:
          street:
            $ref: '#/components/schemas/Street'
          city:
            $ref: '#/components/schemas/City'
          zip:
            $ref: '#/components/schemas/ZipCode'
          country:
            $ref: '#/components/schemas/Country'
          state:
            $ref: '#/components/schemas/State'
      OpeningHours:
        type: string
        minLength: 4
        description: |
          The opening hours in OpenStreetMap format.
  
          Specification: https://wiki.openstreetmap.org/wiki/Key:opening_hours
  
          Reference implementations: https://github.com/opening-hours/
  
          Generator tool: https://projets.pavie.info/yohours/
  
          The service trims leading/trailing whitespaces and stores values as is.
          Values are currently not validated against the OSM format syntax!
        example: 24/7
      PlaceLinks:
        properties:
          www:
            $ref: '#/components/schemas/Url'
          img:
            $ref: '#/components/schemas/Url'
          img_href:
            $ref: '#/components/schemas/Url'
      LatLonDeg:
        type: array
        minLength: 2
        maxLength: 2
        items:
          type: number
          format: double
        description: |
          WGS 84 coordinates (latitude, longitude) in degrees
        example:
          - 48.720334
          - 9.152239
      PlaceRoot:
        description: |
          Immutable properties of a place
        properties:
          id:
            $ref: '#/components/schemas/Id'
          lic:
            $ref: '#/components/schemas/License'
        required:
          - id
          - lic
      PlaceRevision:
        properties:
          created:
            $ref: '#/components/schemas/Activity'
          rev:
            $ref: '#/components/schemas/Revision'
          tit:
            $ref: '#/components/schemas/Title'
          dsc:
            $ref: '#/components/schemas/Description'
          loc:
            $ref: '#/components/schemas/Location'
          cnt:
            $ref: '#/components/schemas/Contact'
          hrs:
            $ref: '#/components/schemas/OpeningHours'
          lnk:
            $ref: '#/components/schemas/PlaceLinks'
          tag:
            $ref: '#/components/schemas/TagArray'
        required:
          - created
          - rev
          - tit
          - dsc
      PlaceRevisionLog:
        type: array
        minLength: 2
        maxLength: 2
        items:
          oneOf:
            - $ref: '#/components/schemas/PlaceRevision'
            - $ref: '#/components/schemas/ReviewStatusLogArray'
      PlaceRevisionLogArray:
        type: array
        items:
          $ref: '#/components/schemas/PlaceRevisionLog'
      ReviewStatusLog:
        properties:
          rev:
            $ref: '#/components/schemas/Revision'
          act:
            $ref: '#/components/schemas/ActivityLog'
          status:
            $ref: '#/components/schemas/ReviewStatus'
      ReviewStatusLogArray:
        type: array
        items:
          $ref: '#/components/schemas/ReviewStatusLog'
      PlaceHistory:
        properties:
          place:
            $ref: '#/components/schemas/PlaceRoot'
          revisions:
            $ref: '#/components/schemas/PlaceRevisionLogArray'
        required:
          - place
      Review:
        properties:
          status:
            $ref: '#/components/schemas/ReviewStatus'
          comment:
            $ref: '#/components/schemas/ActivityComment'
        required:
          - status
      ReviewStatus:
        type: string
        enum:
          - created
          - confirmed
          - rejected
          - archived
        description: |
          * created = initial status of each revision
          * confirmed/rejected = after positive/negative review
          * archived = final status
        example: rejected
      ReviewStatusList:
        type: string
        description: |
          Comma-separated list of multiple review status names
        example: 'created,confirmed'
      UserRole:
        type: string
        enum:
          - guest
          - user
          - scout
          - admin
        description: |
          A user's role
      User:
        properties:
          email:
            $ref: '#/components/schemas/Email'
          email_confirmed:
            type: boolean
          role:
            $ref: '#/components/schemas/UserRole'
        required:
          - email
          - email_confirmed
          - role
      Event:
        properties:
          id:
            $ref: '#/components/schemas/Id'
          title:
            type: string
            example: A great event
          description:
            type: string
            example: Detailed description of the event
          start:
            $ref: '#/components/schemas/EventTime'
          end:
            $ref: '#/components/schemas/EventTime'
          created_at:
            $ref: '#/components/schemas/UnixTimeMillis'
          created_by:
            type: string
            description: |
              The email address of the user who is responsible for the content.
              This information is only available for authorized organizations.
          lat:
            $ref: '#/components/schemas/Latitude'
          lng:
            $ref: '#/components/schemas/Longitude'
          street:
            type: string
          zip:
            type: string
          city:
            type: string
          country:
            type: string
          state:
            type: string
          email:
            $ref: '#/components/schemas/Email'
          telephone:
            $ref: '#/components/schemas/Phone'
          tags:
            $ref: '#/components/schemas/TagArray'
          homepage:
            $ref: '#/components/schemas/Url'
          registration:
            type: string
            enum:
              - email
              - telephone
              - homepage
            example: telephone
            description: Type of registration
          organizer:
            type: string
          image_url:
            $ref: '#/components/schemas/Url'
          image_link_url:
            $ref: '#/components/schemas/Url'
      UnixTime:
        type: integer
        format: int64
        description: |
          Unix time (number of seconds since 00:00::00 1. January, 1970, UTC)
        example: 1547403509
      EventTime:
        description: |
          The start/end time of an event.
  
          Event times are always specified in UTC, independent of the geographical
          location and the actual time zone at this location at the given time.
          Therfore these time stamps should be interpreted as a *naive* date time
          without any time zone. The calculation of the actual, absolute point that
          is needed for chronological ordering of events at different geographical
          locations would require a time zone database to perform this conversion.
  
          Frontends should display and edit event times as if the event is located
          in the UTC time zone, neither taking into account the actual time at the
          geographical location of the event nor the current local time zone of the
          client itself!
        oneOf:
          - $ref: '#/components/schemas/UnixTime'
      UnixTimeMillis:
        type: integer
        format: int64
        readOnly: true
        description: |
          Precise Unix time (number of milliseconds since 00:00::00.000 1. January, 1970, UTC)
          for system-generated time stamps
        example: 1547403509000
      TagCounts:
        type: array
        items:
          type: array
          items:
            oneOf:
              - type: string
              - type: integer
                format: in64
        example:
          - - tag1
            - 52
          - - tag2
            - 0
      Latitude:
        type: number
        format: double
        minimum: -90
        maximum: 90
        example: 37.2
        description: Geographic latitude (in degrees)
      Longitude:
        type: number
        format: double
        minimum: -180
        maximum: 180
        example: 120.7
        description: Geographic longitude (in degrees)
    parameters:
      BoundingBox:
        name: bbox
        in: query
        description: Bounding Box
        schema:
          type: string
          example: '42.27,-7.97,52.58,38.25'
      IdPath:
        name: id
        in: path
        required: true
        schema:
          $ref: '#/components/schemas/Id'
      IdListPath:
        name: ids
        in: path
        required: true
        schema:
          $ref: '#/components/schemas/IdList'
      IdList:
        name: ids
        in: query
        required: false
        schema:
          $ref: '#/components/schemas/IdList'
      TagList:
        name: tags
        in: query
        required: false
        schema:
          $ref: '#/components/schemas/TagList'
      EventStartMin:
        name: start_min
        in: query
        description: Filter events by 'event.start' >= 'start_min'
        schema:
          $ref: '#/components/schemas/EventTime'
      EventStartMax:
        name: start_max
        in: query
        description: Filter events by 'event.start' <= 'start_max'
        schema:
          $ref: '#/components/schemas/EventTime'
      EventFilterText:
        name: text
        in: query
        description: |
          Filter events by textual terms. Hashtags starting with '#' will
          be extracted from the given text and handled as tag filters.
        schema:
          type: string
      EventCreatedBy:
        name: created_by
        in: query
        description: |
          The email address of the event creator. Requests with this parameter
          will be rejected without a valid API token!
        schema:
          $ref: '#/components/schemas/Email'
      EventTagList:
        name: tag
        description: Filter events by tags
        in: query
        required: false
        schema:
          $ref: '#/components/schemas/TagList'
      ReviewStatusList:
        name: status
        in: query
        required: false
        schema:
          $ref: '#/components/schemas/ReviewStatusList'
      PaginationLimit:
        name: limit
        description: Maximum number of items to return or implicit/unlimited if unspecified.
        in: query
        required: false
        schema:
          type: integer
          format: int64
          example: 100
      PaginationOffset:
        name: offset
        description: |
          Number of items to skip in the result list or 0 if unspecified.
  
          The pagination offset is only evaluated in conjunction with the
          corresponding pagination limit parameter!
        in: query
        required: false
        schema:
          type: integer
          format: int64
          example: 1000
    securitySchemes:
      bearerAuth:
        type: http
        scheme: bearer
    responses:
      ParameterError:
        description: Parameters are missing or invalid
      UnauthorizedError:
        description: Access token is missing or invalid or the user has insufficient permissions`
  const t = (key) => {
    return i18n.t("api." + key);
  }
  return (
    <APIWrapper id="api">
      <div className="api-info">
        <div>
          <p>{t("swaggerGuideTitle")}</p>
          <ol className="swaggerGuide">
            <li>{t("swaggerGuideItem1")} <a href="https://editor.swagger.io">editor.swagger.io</a></li>
            <li>{t("swaggerGuideItem2")} File &#8594; import URL</li>
            <li>{t("swaggerGuideItem3")} <a href="https://raw.githubusercontent.com/kartevonmorgen/openfairdb/master/openapi.yaml">https://raw.githubusercontent.com/kartevonmorgen/openfairdb/master/openapi.yaml</a></li>
            <li>{t("swaggerGuideItem4")}</li>
          </ol>
        </div>
        <p className="linkToBackend">{t("linkToBackEnd")}: <a href="https://github.com/kartevonmorgen/openfairdb">https://github.com/kartevonmorgen/openfairdb</a></p>
        <p className="apiDescrpiption">{apiText}</p>
      </div>
    </APIWrapper>
  )
}

const APIWrapper = styled.div`
  background-color: white;
  overflow-x: auto;
  overflow-y: scroll;

  .api-info {
    padding: 20px;
    width: 85%;
    margin: 20px auto;
    height: 500px;
    white-space: pre-wrap;
  }

  .swaggerGuide {
    font-size: 20px;
  }

  .api-info p {
    text-align: left;
  }

  .apiDescrpiption {
    font-size: 20px;
  }

  @media (max-width: 950px) {
    .api-info p {
      font-size: 20px
    }

    p.apiDescrpiption {
      font-size: 15px;
    }

    .swaggerGuide {
      font-size: 15px;
    }
  }
`;

module.exports = translate('translation')(APIPage)