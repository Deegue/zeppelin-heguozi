/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.zeppelin.file;

import java.net.URL;
import java.net.HttpURLConnection;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import javax.ws.rs.core.UriBuilder;
import org.slf4j.Logger;

/**
 * Definition and HTTP invocation methods for all WebHDFS commands
 *
 */
public class HDFSCommand {

  /**
   * Type of HTTP request
   */
  public enum HttpType {
    GET,
    PUT,
    POST,
    DELETE
  }

  /**
   * Definition of WebHDFS operator
   */
  public class Op {
    public String op;
    public HttpType cmd;
    public int minArgs;

    public Op(String op, HttpType cmd, int minArgs) {
      this.op = op;
      this.cmd = cmd;
      this.minArgs = minArgs;
    }
  }

  /**
   * Definition of argument to an operator
   */
  public class Arg {
    public String key;
    public String value;

    public Arg(String key, String value) {
      this.key = key;
      this.value = value;
    }
  }

  // How to connect to WebHDFS
  String url = null;
  String user = null;
  int maxLength = 0;
  Logger logger;

  // Define all the commands available
  public Op getFileStatus      = new Op("GETFILESTATUS", HttpType.GET, 0);
  public Op listStatus         = new Op("LISTSTATUS", HttpType.GET, 0);
  public Op open               = new Op("OPEN", HttpType.GET, 0);
  public Op getContentSummary  = new Op("GETCONTENTSUMMARY", HttpType.GET, 0);
  public Op getFileChecksum    = new Op("GETFILECHECKSUM", HttpType.GET, 0);
  public Op getHomeDirectory   = new Op("GETHOMEDIRECTORY", HttpType.GET, 0);
  public Op getDelegationToken = new Op("GETDELEGATIONTOKEN", HttpType.GET, 0);

  public Op create                = new Op("CREATE", HttpType.PUT, 0);
  public Op mkdirs                = new Op("MKDIRS", HttpType.PUT, 0);
  public Op rename                = new Op("RENAME", HttpType.PUT, 0);
  public Op setReplication        = new Op("SETREPLICATION", HttpType.PUT, 0);
  public Op setOwner              = new Op("SETOWNER", HttpType.PUT, 0);
  public Op setPermission         = new Op("SETPERMISSION", HttpType.PUT, 0);
  public Op setTimes              = new Op("SETTIMES", HttpType.PUT, 0);
  public Op renewDelegationToken  = new Op("RENEWDELEGATIONTOKEN", HttpType.PUT, 0);
  public Op cancelDelegationToken = new Op("CANCELDELEGATIONTOKEN", HttpType.PUT, 0);

  public Op append = new Op("APPEND", HttpType.POST, 0);
  public Op delete = new Op("DELETE", HttpType.DELETE, 0);

  public HDFSCommand(String url, String user, Logger logger, int maxLength) {
    super();
    this.url = url;
    this.user = user;
    this.maxLength = maxLength;
    this.logger = logger;
  }

  public String checkArgs(Op op, String path, Arg[] args) throws Exception {
    if (op == null ||
        path == null ||
        (op.minArgs > 0 &&
            (args == null ||
                args.length != op.minArgs)))
    {
      String a = "";
      a = (op != null) ? a + op.op + "\n" : a;
      a = (path != null) ? a + path + "\n" : a;
      a = (args != null) ? a + args + "\n" : a;
      return a;
    }
    return null;
  }


  // The operator that runs all commands
  public String runCommand(Op op, String path, Arg[] args) throws Exception {

    // Check arguments
    String error = checkArgs(op, path, args);
    if (error != null) {
      logger.error("Bad arguments to command: " + error);
      return "ERROR: BAD ARGS";
    }

    // Build URI
    UriBuilder builder = UriBuilder
        .fromPath(url)
        .path(path)
        .queryParam("user.name", user)
        .queryParam("op", op.op);

    if (args != null) {
      for (Arg a : args) {
        builder = builder.queryParam(a.key, a.value);
      }
    }
    java.net.URI uri = builder.build();

    // Connect and get response string
    URL hdfsUrl = uri.toURL();
    HttpURLConnection con = (HttpURLConnection) hdfsUrl.openConnection();

    con.setRequestMethod(op.cmd.toString());
    int responseCode = con.getResponseCode();
    logger.info("Sending '" + op.cmd.toString() + "' request to URL : " + hdfsUrl);
    logger.info("Response Code : " + responseCode);
    StringBuffer response = new StringBuffer();
    try (BufferedReader in = new BufferedReader(
            new InputStreamReader(con.getInputStream()))) {
      String inputLine;
      while ((inputLine = in.readLine()) != null) {
        response.append(inputLine);
      }
      return response.toString();
    }catch (Exception e){
      logger.error("Error occurs when getting response");
    }
    return null;
  }
}