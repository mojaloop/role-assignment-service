Feature: role-assignment-service server

Scenario: Get Roles
  Given role-assignment-service server
  When I make a GET Roles request
  Then The status should be 'OK'
