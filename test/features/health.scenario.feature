Feature: role-assignment-service server

Scenario: Health Check
  Given role-assignment-service server
  When I get 'Health Check' response
  Then The status should be 'OK'
