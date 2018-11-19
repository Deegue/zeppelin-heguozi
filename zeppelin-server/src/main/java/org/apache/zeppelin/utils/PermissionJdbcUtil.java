package org.apache.zeppelin.utils;

import org.apache.zeppelin.socket.NotebookServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;

/**
 * @Description ： PermissionJdbcUtil
 * @Author ： HeGuoZi
 * @Date ： 17:52 2018/8/16
 * @Modified :
 */
public class PermissionJdbcUtil {

    private static final Logger LOG = LoggerFactory.getLogger(PermissionJdbcUtil.class);

    public static ResultSet executeQuery(String sql) {

        long start = System.currentTimeMillis();
        String url = "jdbc:mysql://rdsdb1901.my.2dfire-inc.com:3306/argus";
        String user = "argus";
        String password = "argus@552208";

        try {
            Class.forName("com.mysql.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
            LOG.error("驱动加载失败！");
        }

        try {
            Connection conn = DriverManager.getConnection(url, user, password);
            Statement st = conn.createStatement();
            return st.executeQuery(sql);
        } catch (SQLException e) {
            e.printStackTrace();
            LOG.error("数据库查询失败！");
        }

        //5.处理数据库返回结果ResultSet
        /**
         *  while (rs.next()){
         System.out.print(rs.getString("user_name")+""+rs.getString("password"));
         }
         */

        long end = System.currentTimeMillis();
        LOG.info("验证db权限耗时：" + (end - start) / 1000.0 + "s");

        return null;
    }
}
