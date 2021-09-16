Feature: role-assignment-service server

Scenario: Get Participants
  Given role-assignment-service server
  When I make a GET Participants request
  Then The status should be 'OK'
